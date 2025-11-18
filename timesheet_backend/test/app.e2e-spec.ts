import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from './../src/app.module'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from '../src/user/entities/user.entity'
import { Repository } from 'typeorm'
import { Role } from '../src/user/entities/role.enum'

describe('App and Auth (e2e)', () => {
  let app: INestApplication
  let httpServer: any
  let userRepository: Repository<User>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
    httpServer = app.getHttpServer()
    userRepository = app.get<Repository<User>>(getRepositoryToken(User))

    await userRepository.clear()
    await userRepository.save({
      email: 'test@example.com',
      password: 'password',
      role: Role.SuperAdmin,
    })
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await userRepository.clear()
    await userRepository.save({
      email: 'test@example.com',
      password: 'password',
      role: Role.SuperAdmin,
    })
  })

  it('/ (GET)', () => {
    return request(httpServer)
      .get('/')
      .expect(200)
      .expect('Hello World!')
  })

  describe('/auth/login (POST)', () => {
    it('should fail with wrong credentials', () => {
      return request(httpServer)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401)
    })

    it('should return a JWT on successful login', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(201)

      expect(response.body).toHaveProperty('access_token')
    })
  })

  describe('/user/me (GET)', () => {
    it('should fail without an authentication token', () => {
      return request(httpServer)
        .get('/user/me')
        .expect(401)
    })

    it('should return the user profile with a valid token', async () => {
      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })

      const token = loginResponse.body.access_token

      const meResponse = await request(httpServer)
        .get('/user/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(meResponse.body).toMatchObject({
        id: expect.any(Number),
        email: 'test@example.com',
        role: Role.SuperAdmin,
      })
    })
  })
})
