import { TestingModule, Test } from '@nestjs/testing'
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ContextIdFactory } from '@nestjs/core'
import { UserService } from './user.service'
import { User } from './entities/user.entity'
import { Role } from './entities/role.enum'
import { CurrentUserService } from '../common/current-user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ForbiddenException } from '@nestjs/common'

const buildActor = (role: Role): User =>
  ({
    id: Math.floor(Math.random() * 10000) + 1,
    email: `${role}@example.com`,
    role,
  }) as User

describe('UserService (role enforcement)', () => {
  let moduleRef: TestingModule
  let repository: Repository<User>

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UserService, CurrentUserService],
    }).compile()

    repository = moduleRef.get<Repository<User>>(getRepositoryToken(User))
  })

  beforeEach(async () => {
    await repository.clear()
  })

  const resolveService = async (actor: User) => {
    const contextId = ContextIdFactory.create()
    moduleRef.registerRequestByContextId({ user: actor }, contextId)
    return moduleRef.resolve(UserService, contextId)
  }

  it('allows super-admin to create admin and worker users', async () => {
    const service = await resolveService(buildActor(Role.SuperAdmin))

    const adminDto: CreateUserDto = {
      email: 'admin@example.com',
      password: 'password',
      role: Role.Admin,
    }
    const workerDto: CreateUserDto = {
      email: 'worker@example.com',
      password: 'password',
      role: Role.Worker,
    }

    const admin = await service.createUser(adminDto)
    const worker = await service.createUser(workerDto)

    expect(admin.role).toBe(Role.Admin)
    expect(worker.role).toBe(Role.Worker)
  })

  it('prevents admin from creating admin users', async () => {
    const service = await resolveService(buildActor(Role.Admin))
    const adminDto: CreateUserDto = {
      email: 'new-admin@example.com',
      password: 'password',
      role: Role.Admin,
    }

    await expect(service.createUser(adminDto)).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('allows admin to create worker users', async () => {
    const service = await resolveService(buildActor(Role.Admin))
    const workerDto: CreateUserDto = {
      email: 'worker@example.com',
      password: 'password',
      role: Role.Worker,
    }

    const worker = await service.createUser(workerDto)
    expect(worker.role).toBe(Role.Worker)
  })

  it('prevents admin from deleting admins', async () => {
    const superAdminService = await resolveService(buildActor(Role.SuperAdmin))
    const admin = await superAdminService.createUser({
      email: 'admin@example.com',
      password: 'password',
      role: Role.Admin,
    })

    const adminService = await resolveService(buildActor(Role.Admin))
    await expect(adminService.deleteUser(admin.id)).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('updates user data when permitted', async () => {
    const superAdminService = await resolveService(buildActor(Role.SuperAdmin))
    const worker = await superAdminService.createUser({
      email: 'worker@example.com',
      password: 'password',
      role: Role.Worker,
    })

    const updateDto: UpdateUserDto = {
      email: 'updated.worker@example.com',
    }

    const updated = await superAdminService.updateUser(worker.id, updateDto)
    expect(updated.email).toBe(updateDto.email)
  })
})
