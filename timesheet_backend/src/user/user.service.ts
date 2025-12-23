import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { Role } from './entities/role.enum'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { CurrentUserService } from '../common/current-user.service'

@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly currentUserService: CurrentUserService,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } })
  }

  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'createdAt', 'updatedAt'],
    })
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } })
  }

  async listManagedUsers(): Promise<User[]> {
    const actor = this.currentUserService.get()
    if (actor.role !== Role.Admin) {
      throw new ForbiddenException('Insufficient permissions')
    }
    return this.userRepository.find()
  }

  async getManagedUser(id: string): Promise<User> {
    const actor = this.currentUserService.get()
    if (actor.role !== Role.Admin) {
      throw new ForbiddenException('Insufficient permissions')
    }
    const user = await this.userRepository.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const actor = this.currentUserService.get()
    if (actor.role !== Role.Admin) {
      throw new ForbiddenException('Insufficient permissions')
    }

    await this.ensureEmailAvailable(dto.email)

    const user = this.userRepository.create(dto)
    return this.userRepository.save(user)
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const actor = this.currentUserService.get()
    if (actor.role !== Role.Admin) {
      throw new ForbiddenException('Insufficient permissions')
    }
    const user = await this.userRepository.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    if (dto.email && dto.email !== user.email) {
      await this.ensureEmailAvailable(dto.email)
    }

    const updated = Object.assign(user, dto)
    return this.userRepository.save(updated)
  }

  async deleteUser(id: string): Promise<void> {
    const actor = this.currentUserService.get()
    if (actor.role !== Role.Admin) {
      throw new ForbiddenException('Insufficient permissions')
    }

    if (actor.id === id) {
      throw new BadRequestException('Cannot delete yourself')
    }

    const user = await this.userRepository.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.userRepository.delete(id)
  }

  private async ensureEmailAvailable(email: string) {
    const existing = await this.findOneByEmail(email)
    if (existing) {
      throw new ConflictException('Email already exists')
    }
  }
}