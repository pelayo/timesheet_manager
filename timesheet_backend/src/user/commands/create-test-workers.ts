import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { ConflictException } from '@nestjs/common'
import { AppModule } from '../../app.module'
import { UserService } from '../user.service'
import { Role } from '../entities/role.enum'
import { User } from '../entities/user.entity'
import { CreateUserDto } from '../dto/create-user.dto'

const workerSeeds: CreateUserDto[] = [
  {
    email: 'worker.one@example.com',
    password: 'password',
    role: Role.Worker,
  },
  {
    email: 'worker.two@example.com',
    password: 'password',
    role: Role.Worker,
  },
  {
    email: 'worker.three@example.com',
    password: 'password',
    role: Role.Worker,
  },
]

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const userService = app.get(UserService)

  const actor: User = {
    id: 0,
    email: 'system@local',
    role: Role.SuperAdmin,
  } as User

  const results = []

  for (const seed of workerSeeds) {
    try {
      const created = await userService.createUser(actor, seed)
      results.push(created)
    } catch (error) {
      const isConflict =
        error instanceof ConflictException ||
        (error instanceof Error && error.message.includes('Email already exists'))
      if (isConflict) {
        continue
      }
      throw error
    }
  }

  if (results.length === 0) {
    console.log('No new test workers were created (they may already exist).')
  } else {
    console.log('Created test workers:')
    results.forEach((worker) => console.log(`- ${worker.email} (id: ${worker.id})`))
  }

  await app.close()
}

bootstrap().catch((error) => {
  console.error('Failed to create test workers', error)
  process.exit(1)
})
