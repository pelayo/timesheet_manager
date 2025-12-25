import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/user/entities/user.entity';
import { Role } from '../src/user/entities/role.enum';
import { Project } from '../src/projects/entities/project.entity';
import { Task, TaskStatus } from '../src/tasks/entities/task.entity';
import { ProjectMember } from '../src/project-members/entities/project-member.entity';
import { TimeEntry } from '../src/time-entries/entities/time-entry.entity';

import { UserPinnedTask } from '../src/time-entries/entities/user-pinned-task.entity';

describe('Time Entries (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  let taskRepository: Repository<Task>;
  let memberRepository: Repository<ProjectMember>;
  let timeEntryRepository: Repository<TimeEntry>;
  let pinnedTaskRepository: Repository<UserPinnedTask>;

  let user: User;
  let project: Project;
  let task: Task;
  let tokenUser: string;

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
    memberRepository = app.get<Repository<ProjectMember>>(getRepositoryToken(ProjectMember));
    timeEntryRepository = app.get<Repository<TimeEntry>>(getRepositoryToken(TimeEntry));
    pinnedTaskRepository = app.get<Repository<UserPinnedTask>>(getRepositoryToken(UserPinnedTask));
  });

  beforeEach(async () => {
    await timeEntryRepository.clear();
    await pinnedTaskRepository.clear();
    await taskRepository.clear();
    await memberRepository.clear();
    await projectRepository.clear();
    await userRepository.clear();

    [user] = await userRepository.save([
      { email: 'user@te.com', password: 'p', role: Role.User },
    ]);
    project = await projectRepository.save({ name: 'Project TE' });
    task = await taskRepository.save({ name: 'Task 1', projectId: project.id });
    await memberRepository.save({ projectId: project.id, userId: user.id });

    const resUser = await request(httpServer).post('/auth/login').send({ email: 'user@te.com', password: 'p' });
    tokenUser = resUser.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Time Log', () => {
      it('should log time', async () => {
          const res = await request(httpServer)
            .post('/me/time-entries')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ taskId: task.id, workDate: '2023-01-01', minutes: 60 })
            .expect(201);
          
          expect(res.body.minutes).toBe(60);
          expect(res.body.userId).toBe(user.id);
      });

      it('should fail if task closed', async () => {
          await taskRepository.update(task.id, { status: TaskStatus.CLOSED });
          await request(httpServer)
            .post('/me/time-entries')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ taskId: task.id, workDate: '2023-01-01', minutes: 60 })
            .expect(400);
      });
  });

  describe('Weekly Timesheet', () => {
      it('should return timesheet grid', async () => {
          await timeEntryRepository.save({
              userId: user.id,
              taskId: task.id,
              workDate: '2023-01-02', // Monday
              minutes: 120,
          });

          const res = await request(httpServer)
            .get('/me/timesheet?weekStart=2023-01-01') // Sunday start
            .set('Authorization', `Bearer ${tokenUser}`)
            .expect(200);
          
          expect(res.body.weekStart).toBe('2023-01-01');
          expect(res.body.rows).toHaveLength(1);
          expect(res.body.rows[0].minutesByDay['2023-01-02']).toBe(120);
          expect(res.body.totalWeek).toBe(120);
      });

      it('should update cell', async () => {
          // Create entry via PUT cell
          await request(httpServer)
            .put('/me/timesheet/cell')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ taskId: task.id, workDate: '2023-01-01', minutes: 60 })
            .expect(200);
          
          const entry = await timeEntryRepository.findOne({ where: { userId: user.id, taskId: task.id, workDate: '2023-01-01' } });
          expect(entry).toBeDefined();
          expect(entry!.minutes).toBe(60);

          // Delete entry via PUT cell 0
          await request(httpServer)
            .put('/me/timesheet/cell')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ taskId: task.id, workDate: '2023-01-01', minutes: 0 })
            .expect(200);

          const deleted = await timeEntryRepository.findOne({ where: { userId: user.id, taskId: task.id, workDate: '2023-01-01' } });
          expect(deleted).toBeNull();
      });
  });
});
