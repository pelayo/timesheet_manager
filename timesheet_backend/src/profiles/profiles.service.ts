import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Profile } from './entities/profile.entity'
import { CreateProfileDto } from './dto/create-profile.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {}

  async findAll(): Promise<Profile[]> {
    return this.profilesRepository.find({ order: { name: 'ASC' } })
  }

  async findOne(id: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({ where: { id } })
    if (!profile) {
      throw new NotFoundException('Profile not found')
    }
    return profile
  }

  async create(dto: CreateProfileDto): Promise<Profile> {
    const profile = this.profilesRepository.create(dto)
    return this.profilesRepository.save(profile)
  }

  async update(id: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findOne(id)
    const updated = Object.assign(profile, dto)
    return this.profilesRepository.save(updated)
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id)
    await this.profilesRepository.remove(profile)
  }
}
