import 'dotenv/config'
import { hash } from 'bcryptjs'
import { AppDataSource } from '../data-source'
import { User } from '../user/entities/user.entity'

const PASSWORD_SALT_ROUNDS = 10
const isBcryptHash = (value: string) => value.startsWith('$2')

async function bootstrap() {
  await AppDataSource.initialize()
  const repo = AppDataSource.getRepository(User)
  const users = await repo
    .createQueryBuilder('user')
    .addSelect('user.password')
    .getMany()

  let updated = 0

  for (const user of users) {
    if (!user.password || isBcryptHash(user.password)) {
      continue
    }

    const hashed = await hash(user.password, PASSWORD_SALT_ROUNDS)
    await repo.update(user.id, { password: hashed })
    updated++
  }

  console.log(`Rehashed ${updated} user password(s).`)
  await AppDataSource.destroy()
}

bootstrap().catch(async (error) => {
  console.error('Failed to rehash passwords', error)
  try {
    await AppDataSource.destroy()
  } catch (shutdownError) {
    console.error('Failed to close database connection', shutdownError)
  }
  process.exit(1)
})
