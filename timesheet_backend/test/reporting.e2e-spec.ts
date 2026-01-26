import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/user/entities/user.entity';
import { Role } from '../src/user/entities/role.enum';
import { Project } from '../src/projects/entities/project.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { TimeEntry } from '../src/time-entries/entities/time-entry.entity';

describe('Reporting (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  let taskRepository: Repository<Task>;
  let timeEntryRepository: Repository<TimeEntry>;
  let tokenAdmin: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    httpServer = app.getHttpServer();
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    projectRepository = app.get<Repository<Project>>(getRepositoryToken(Project));
    taskRepository = app.get<Repository<Task>>(getRepositoryToken(Task));
    timeEntryRepository = app.get<Repository<TimeEntry>>(getRepositoryToken(TimeEntry));
  });

  beforeEach(async () => {
    await timeEntryRepository.clear();
    await taskRepository.clear();
    await projectRepository.clear();
    await userRepository.clear();

    const [admin, worker] = await userRepository.save([
      { email: 'admin@report.com', password: 'p', role: Role.Admin },
      { email: 'worker@report.com', password: 'p', role: Role.User },
    ]);

    const chargeableProject = await projectRepository.save({
      name: 'Chargeable Project',
      isChargeable: true,
    });
    const nonChargeableProject = await projectRepository.save({
      name: 'Non-Chargeable Project',
      isChargeable: false,
    });

    const chargeableTask = await taskRepository.save({
      name: 'Chargeable Task',
      projectId: chargeableProject.id,
    });
    const nonChargeableTask = await taskRepository.save({
      name: 'Non-Chargeable Task',
      projectId: nonChargeableProject.id,
    });

    await timeEntryRepository.save([
      {
        userId: worker.id,
        taskId: chargeableTask.id,
        workDate: '2023-01-10',
        minutes: 120,
      },
      {
        userId: worker.id,
        taskId: nonChargeableTask.id,
        workDate: '2023-01-11',
        minutes: 60,
      },
    ]);

    const resAdmin = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'admin@report.com', password: 'p' });
    tokenAdmin = resAdmin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should summarize chargeable vs non-chargeable totals', async () => {
    const res = await request(httpServer)
      .get('/admin/reports/chargeable-summary?from=2023-01-01&to=2023-01-31')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(res.body.chargeableMinutes).toBe(120);
    expect(res.body.nonChargeableMinutes).toBe(60);
  });
});
