import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from './../src/app.module'

describe('App and Auth (e2e)', () => {
  let app: INestApplication
  let httpServer: any

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
    httpServer = app.getHttpServer()
  })

  afterAll(async () => {
    await app.close()
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

      expect(meResponse.body).toEqual({
        id: 1,
        email: 'test@example.com',
      })
    })
  })
})

