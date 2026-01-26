import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import request from 'supertest'
import { Repository } from 'typeorm'
import { AppModule } from '../src/app.module'
import { User } from '../src/user/entities/user.entity'
import { Role } from '../src/user/entities/role.enum'
import { Project } from '../src/projects/entities/project.entity'
import { ProjectMember, ProjectRole } from '../src/project-members/entities/project-member.entity'
import { TimeAssignment } from '../src/time-assignments/entities/time-assignment.entity'

describe('Time Assignments (e2e)', () => {
  let app: INestApplication
  let httpServer: any
  let userRepository: Repository<User>
  let projectRepository: Repository<Project>
  let memberRepository: Repository<ProjectMember>
  let timeAssignmentRepository: Repository<TimeAssignment>

  let admin: User
  let pmLead: User
  let pmMember: User
  let regularUser: User
  let project: Project

  let adminToken: string
  let pmLeadToken: string
  let pmMemberToken: string
  let userToken: string

  const login = async (email: string, password: string) => {
    const res = await request(httpServer).post('/auth/login').send({ email, password })
    return res.body.access_token
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
    httpServer = app.getHttpServer()
    userRepository = app.get<Repository<User>>(getRepositoryToken(User))
    projectRepository = app.get<Repository<Project>>(getRepositoryToken(Project))
    memberRepository = app.get<Repository<ProjectMember>>(getRepositoryToken(ProjectMember))
    timeAssignmentRepository = app.get<Repository<TimeAssignment>>(getRepositoryToken(TimeAssignment))
  })

  beforeEach(async () => {
    await timeAssignmentRepository.clear()
    await memberRepository.clear()
    await projectRepository.clear()
    await userRepository.clear()

    const users = await userRepository.save([
      { email: 'admin@ta.com', password: 'p', role: Role.Admin },
      { email: 'pmlead@ta.com', password: 'p', role: Role.ProjectManager },
      { email: 'pmmember@ta.com', password: 'p', role: Role.ProjectManager },
      { email: 'user@ta.com', password: 'p', role: Role.User },
    ])
    admin = users[0]
    pmLead = users[1]
    pmMember = users[2]
    regularUser = users[3]

    project = await projectRepository.save({ name: 'Project TA', code: 'TA' })

    await memberRepository.save({ projectId: project.id, userId: pmLead.id, role: ProjectRole.LEAD })
    await memberRepository.save({ projectId: project.id, userId: pmMember.id, role: ProjectRole.MEMBER })

    adminToken = await login('admin@ta.com', 'p')
    pmLeadToken = await login('pmlead@ta.com', 'p')
    pmMemberToken = await login('pmmember@ta.com', 'p')
    userToken = await login('user@ta.com', 'p')
  })

  afterAll(async () => {
    await app.close()
  })

  it('allows admins to create, update, and delete time assignments', async () => {
    const createRes = await request(httpServer)
      .post(`/admin/projects/${project.id}/time-assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: regularUser.id,
        weekStart: '2026-01-05',
        hours: 40,
      })
      .expect(201)

    expect(createRes.body.id).toBeDefined()

    const assignmentId = createRes.body.id

    const updateRes = await request(httpServer)
      .patch(`/admin/time-assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ hours: 32 })
      .expect(200)

    expect(updateRes.body.hours).toBe(32)

    await request(httpServer)
      .delete(`/admin/time-assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
  })

  it('allows project manager leads to manage assignments for their project', async () => {
    const createRes = await request(httpServer)
      .post(`/admin/projects/${project.id}/time-assignments`)
      .set('Authorization', `Bearer ${pmLeadToken}`)
      .send({
        userId: regularUser.id,
        weekStart: '2026-02-02',
        hours: 20,
      })
      .expect(201)

    const listRes = await request(httpServer)
      .get(`/admin/projects/${project.id}/time-assignments`)
      .set('Authorization', `Bearer ${pmLeadToken}`)
      .expect(200)

    expect(listRes.body).toHaveLength(1)
    expect(listRes.body[0].id).toBe(createRes.body.id)
  })

  it('rejects project managers who are not leads', async () => {
    await request(httpServer)
      .post(`/admin/projects/${project.id}/time-assignments`)
      .set('Authorization', `Bearer ${pmMemberToken}`)
      .send({
        userId: regularUser.id,
        weekStart: '2026-03-02',
        hours: 15,
      })
      .expect(403)
  })

  it('rejects regular users', async () => {
    await request(httpServer)
      .get(`/admin/projects/${project.id}/time-assignments`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403)
  })
})
