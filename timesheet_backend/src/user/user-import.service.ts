import { Injectable, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { hash } from 'bcryptjs'
import { User } from './entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'

const PASSWORD_SALT_ROUNDS = 10

@Injectable()
export class UserImportService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } })
  }

  async createUserForImport(dto: CreateUserDto): Promise<User> {
    await this.ensureEmailAvailable(dto.email)

    const user = this.userRepository.create({
      ...dto,
      password: await this.hashPassword(dto.password),
    })
    return this.userRepository.save(user)
  }

  private async ensureEmailAvailable(email: string) {
    const existing = await this.findOneByEmail(email)
    if (existing) {
      throw new ConflictException('Email already exists')
    }
  }

  private async hashPassword(password: string) {
    return hash(password, PASSWORD_SALT_ROUNDS)
  }
}
