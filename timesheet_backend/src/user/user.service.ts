import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { Role } from './entities/role.enum'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } })
  }

  async listManagedUsers(actor: User): Promise<User[]> {
    this.ensureManager(actor.role)

    const where =
      actor.role === Role.Admin
        ? { role: Role.Worker }
        : { role: In([Role.Admin, Role.Worker]) }

    return this.userRepository.find({ where })
  }

  async getManagedUser(actor: User, id: number): Promise<User> {
    this.ensureManager(actor.role)
    const user = await this.userRepository.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    this.ensureCanManage(actor.role, user.role)
    return user
  }

  async createUser(actor: User, dto: CreateUserDto): Promise<User> {
    this.ensureManager(actor.role)
    this.ensureRoleAllowed(actor.role, dto.role)

    await this.ensureEmailAvailable(dto.email)

    const user = this.userRepository.create(dto)
    return this.userRepository.save(user)
  }

  async updateUser(actor: User, id: number, dto: UpdateUserDto): Promise<User> {
    this.ensureManager(actor.role)
    const user = await this.userRepository.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const targetRole = dto.role ?? user.role
    this.ensureRoleAllowed(actor.role, targetRole)
    this.ensureCanManage(actor.role, user.role)

    if (dto.email && dto.email !== user.email) {
      await this.ensureEmailAvailable(dto.email)
    }

    const updated = Object.assign(user, dto)
    return this.userRepository.save(updated)
  }

  async deleteUser(actor: User, id: number): Promise<void> {
    this.ensureManager(actor.role)
    const user = await this.userRepository.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    this.ensureCanManage(actor.role, user.role)
    await this.userRepository.delete(id)
  }

  private ensureManager(role: Role | undefined) {
    if (!role || (role !== Role.SuperAdmin && role !== Role.Admin)) {
      throw new ForbiddenException('Only admin users can manage accounts')
    }
  }

  private ensureRoleAllowed(actorRole: Role, targetRole: Role) {
    if (targetRole === Role.SuperAdmin) {
      throw new BadRequestException('Creating or updating super admin users is not allowed')
    }

    if (actorRole === Role.Admin && targetRole !== Role.Worker) {
      throw new ForbiddenException('Admins can only manage worker users')
    }
  }

  private ensureCanManage(actorRole: Role, targetRole: Role) {
    if (actorRole === Role.SuperAdmin) {
      return
    }

    if (actorRole === Role.Admin && targetRole === Role.Worker) {
      return
    }

    throw new ForbiddenException('Insufficient permissions to manage this user')
  }

  private async ensureEmailAvailable(email: string) {
    const existing = await this.findOneByEmail(email)
    if (existing) {
      throw new ConflictException('Email already exists')
    }
  }
}
