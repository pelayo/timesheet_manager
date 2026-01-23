import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { User } from './entities/user.entity'
import { Role } from './entities/role.enum'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { CurrentUserService } from '../common/current-user.service'
import { hash } from 'bcryptjs'
import { UserProfile } from '../user-profiles/entities/user-profile.entity'

const PASSWORD_SALT_ROUNDS = 10

@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
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

  async listManagedUsers(search?: string, page: number = 1, limit: number = 10): Promise<{ items: User[]; total: number }> {
    const actor = this.currentUserService.get()
    if (actor.role !== Role.Admin) {
      throw new ForbiddenException('Insufficient permissions')
    }
    const where: any = {};
    if (search) {
      where.email = Like(`%${search}%`);
    }

    const [items, total] = await this.userRepository.findAndCount({
      where,
      order: { email: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
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

    const profileId = await this.resolveProfileId(dto.profileId)
    const user = this.userRepository.create({
      email: dto.email,
      role: dto.role,
      profileId: profileId ?? null,
      password: await this.hashPassword(dto.password),
    })
    return this.userRepository.save(user)
  }

  async createUserForImport(dto: CreateUserDto): Promise<User> {
    await this.ensureEmailAvailable(dto.email)

    const profileId = await this.resolveProfileId(dto.profileId)
    const user = this.userRepository.create({
      email: dto.email,
      role: dto.role,
      profileId: profileId ?? null,
      password: await this.hashPassword(dto.password),
    })
    return this.userRepository.save(user)
  }

  async setPasswordHash(userId: string, password: string): Promise<void> {
    const hashed = await this.hashPassword(password)
    await this.userRepository.save({ id: userId, password: hashed })
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

    const { profileId, ...rest } = dto
    const resolvedProfileId = await this.resolveProfileId(profileId)
    const updated = Object.assign(user, rest)
    if (profileId !== undefined) {
      updated.profileId = resolvedProfileId ?? null
    }
    if (dto.password) {
      updated.password = await this.hashPassword(dto.password)
    }
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

  private async hashPassword(password: string) {
    return hash(password, PASSWORD_SALT_ROUNDS)
  }

  private async resolveProfileId(profileId?: string | null): Promise<string | null | undefined> {
    if (profileId === undefined) {
      return undefined
    }
    if (profileId === null) {
      return null
    }
    const profile = await this.userProfileRepository.findOne({ where: { id: profileId } })
    if (!profile) {
      throw new NotFoundException('User profile not found')
    }
    return profile.id
  }
}
