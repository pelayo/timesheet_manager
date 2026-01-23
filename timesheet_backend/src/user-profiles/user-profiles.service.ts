import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserProfile } from './entities/user-profile.entity'
import { CreateUserProfileDto } from './dto/create-user-profile.dto'
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'

@Injectable()
export class UserProfilesService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfilesRepository: Repository<UserProfile>,
  ) {}

  async list(active?: boolean): Promise<UserProfile[]> {
    const where = active === undefined ? {} : { active }
    return this.userProfilesRepository.find({ where, order: { name: 'ASC' } })
  }

  async getById(id: string): Promise<UserProfile> {
    const profile = await this.userProfilesRepository.findOne({ where: { id } })
    if (!profile) {
      throw new NotFoundException('User profile not found')
    }
    return profile
  }

  async create(dto: CreateUserProfileDto): Promise<UserProfile> {
    const profile = this.userProfilesRepository.create(dto)
    return this.userProfilesRepository.save(profile)
  }

  async update(id: string, dto: UpdateUserProfileDto): Promise<UserProfile> {
    const profile = await this.getById(id)
    const updated = Object.assign(profile, dto)
    return this.userProfilesRepository.save(updated)
  }

  async delete(id: string): Promise<void> {
    await this.getById(id)
    await this.userProfilesRepository.delete(id)
  }
}
