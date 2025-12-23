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

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  let taskRepository: Repository<Task>;
  let memberRepository: Repository<ProjectMember>;

  let admin: User;
  let user: User;
  let project: Project;
  let tokenAdmin: string;
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
  });

  beforeEach(async () => {
    await taskRepository.clear();
    await memberRepository.clear();
    await projectRepository.clear();
    await userRepository.clear();

    [admin, user] = await userRepository.save([
      { email: 'admin@t.com', password: 'p', role: Role.Admin },
      { email: 'user@t.com', password: 'p', role: Role.User },
    ]);
    project = await projectRepository.save({ name: 'Project T' });

    const resAdmin = await request(httpServer).post('/auth/login').send({ email: 'admin@t.com', password: 'p' });
    tokenAdmin = resAdmin.body.access_token;
    
    const resUser = await request(httpServer).post('/auth/login').send({ email: 'user@t.com', password: 'p' });
    tokenUser = resUser.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Admin Tasks', () => {
      it('should create a task', async () => {
          const res = await request(httpServer)
            .post(`/admin/projects/${project.id}/tasks`)
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ name: 'Task 1' })
            .expect(201);
          
          expect(res.body.name).toBe('Task 1');
          expect(res.body.projectId).toBe(project.id);
      });

      it('should close a task', async () => {
          const task = await taskRepository.save({ name: 'T1', projectId: project.id });
          const res = await request(httpServer)
             .post(`/admin/tasks/${task.id}/close`)
             .set('Authorization', `Bearer ${tokenAdmin}`)
             .expect(201);
          
          expect(res.body.status).toBe(TaskStatus.CLOSED);
      });
  });

  describe('User Tasks', () => {
      it('should list tasks if member', async () => {
          await memberRepository.save({ projectId: project.id, userId: user.id });
          await taskRepository.save({ name: 'T1', projectId: project.id });

          const res = await request(httpServer)
            .get(`/me/projects/${project.id}/tasks`)
            .set('Authorization', `Bearer ${tokenUser}`)
            .expect(200);
          
          expect(res.body).toHaveLength(1);
      });

      it('should fail if not member', async () => {
          await request(httpServer)
            .get(`/me/projects/${project.id}/tasks`)
            .set('Authorization', `Bearer ${tokenUser}`)
            .expect(403);
      });
  });
});
