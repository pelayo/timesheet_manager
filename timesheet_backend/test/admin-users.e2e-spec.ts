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

  let admin: User
  let user: User

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
      { email: 'admin@example.com', password: 'password', role: Role.Admin },
      { email: 'user@example.com', password: 'password', role: Role.User },
    ])
    ;[admin, user] = saved
  })

  afterAll(async () => {
    await app.close()
  })

  it('admin can create users', async () => {
    const token = await loginAndGetToken(admin.email, 'password')

    const userRes = await request(httpServer)
      .post('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'new.user@example.com', password: 'password', role: Role.User })
      .expect(201)

    expect(userRes.body.role).toBe(Role.User)
  })

  it('admin can delete users', async () => {
    const token = await loginAndGetToken(admin.email, 'password')
    const userToDelete = await request(httpServer)
      .post('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'delete.me@example.com', password: 'password', role: Role.User })
      .expect(201)

    await request(httpServer)
      .delete(`/admin/users/${userToDelete.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })

  it('user cannot access admin endpoints', async () => {
    const token = await loginAndGetToken(user.email, 'password')

    await request(httpServer)
      .get('/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403)
  })
})