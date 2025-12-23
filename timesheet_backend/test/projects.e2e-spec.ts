import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/user/entities/user.entity';
import { Role } from '../src/user/entities/role.enum';
import { Project } from '../src/projects/entities/project.entity';
import { ProjectMember } from '../src/project-members/entities/project-member.entity';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  let memberRepository: Repository<ProjectMember>;

  let admin: User;
  let user: User;
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
    memberRepository = app.get<Repository<ProjectMember>>(getRepositoryToken(ProjectMember));
  });

  beforeEach(async () => {
    await memberRepository.clear();
    await projectRepository.clear();
    await userRepository.clear();

    [admin, user] = await userRepository.save([
      { email: 'admin@p.com', password: 'p', role: Role.Admin },
      { email: 'user@p.com', password: 'p', role: Role.User },
    ]);

    const resAdmin = await request(httpServer).post('/auth/login').send({ email: 'admin@p.com', password: 'p' });
    tokenAdmin = resAdmin.body.access_token;
    
    const resUser = await request(httpServer).post('/auth/login').send({ email: 'user@p.com', password: 'p' });
    tokenUser = resUser.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Admin Projects', () => {
      it('should create a project', async () => {
          const res = await request(httpServer)
            .post('/admin/projects')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ name: 'Project A', code: 'A' })
            .expect(201);
          
          expect(res.body.name).toBe('Project A');
          expect(res.body.id).toBeDefined();
      });

      it('should list projects', async () => {
          await projectRepository.save({ name: 'P1', code: '1' });
          const res = await request(httpServer)
            .get('/admin/projects')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .expect(200);
          expect(res.body).toHaveLength(1);
      });
  });

  describe('User Projects', () => {
      it('should list only assigned projects', async () => {
          const p1 = await projectRepository.save({ name: 'P1' });
          const p2 = await projectRepository.save({ name: 'P2' });

          await memberRepository.save({ projectId: p1.id, userId: user.id });

          const res = await request(httpServer)
            .get('/me/projects')
            .set('Authorization', `Bearer ${tokenUser}`)
            .expect(200);
          
          expect(res.body).toHaveLength(1);
          expect(res.body[0].id).toBe(p1.id);
      });
  });
});
