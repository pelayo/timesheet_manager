import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import request from 'supertest'
import { Repository } from 'typeorm'
import { AppModule } from '../src/app.module'
import { User } from '../src/user/entities/user.entity'
import { Role } from '../src/user/entities/role.enum'

describe('AdminUserController (e2e)', () => {
  let app: INestApplication
  let httpServer: any
  let userRepository: Repository<User>

  let superAdmin: User
  let admin: User
  let worker: User

  const loginAndGetToken = async (email: string, password: string) => {
    const res = await request(httpServer)
      .post('/auth/login')
      .send({ email, password })
      .expect(201)
    return res.body.access_token as string
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
  })

  beforeEach(async () => {
    await userRepository.clear()
    const saved = await userRepository.save([
      { email: 'super@example.com', password: 'password', role: Role.SuperAdmin },
      { email: 'admin@example.com', password: 'password', role: Role.Admin },
      { email: 'worker@example.com', password: 'password', role: Role.Worker },
    ])
    ;[superAdmin, admin, worker] = saved
  })

  afterAll(async () => {
    await app.close()
  })

  it('super-admin can create admin and worker users', async () => {
    const token = await loginAndGetToken(superAdmin.email, 'password')

    const adminRes = await request(httpServer)
      .post('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'new.admin@example.com', password: 'password', role: Role.Admin })
      .expect(201)

    const workerRes = await request(httpServer)
      .post('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'new.worker@example.com', password: 'password', role: Role.Worker })
      .expect(201)

    expect(adminRes.body.role).toBe(Role.Admin)
    expect(workerRes.body.role).toBe(Role.Worker)
  })

  it('super-admin cannot create super-admin users', async () => {
    const token = await loginAndGetToken(superAdmin.email, 'password')

    await request(httpServer)
      .post('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'another.super@example.com', password: 'password', role: Role.SuperAdmin })
      .expect(400)
  })

  it('admin can create worker users but not admins', async () => {
    const token = await loginAndGetToken(admin.email, 'password')

    await request(httpServer)
      .post('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'fresh.worker@example.com', password: 'password', role: Role.Worker })
      .expect(201)

    await request(httpServer)
      .post('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'blocked.admin@example.com', password: 'password', role: Role.Admin })
      .expect(403)
  })

  it('admin cannot delete another admin but can delete workers', async () => {
    const token = await loginAndGetToken(admin.email, 'password')

    await request(httpServer)
      .delete(`/admin/users/${admin.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403)

    const workerRes = await request(httpServer)
      .post('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'temp.worker@example.com', password: 'password', role: Role.Worker })
      .expect(201)

    await request(httpServer)
      .delete(`/admin/users/${workerRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })

  it('worker cannot access admin endpoints', async () => {
    const token = await loginAndGetToken(worker.email, 'password')

    await request(httpServer)
      .get('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403)
  })
})
