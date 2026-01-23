import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'
import { Profile } from './entities/profile.entity'
import { CreateProfileDto } from './dto/create-profile.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async create(dto: CreateProfileDto): Promise<Profile> {
    const profile = this.profileRepository.create({
      ...dto,
      active: dto.active ?? true,
    })
    return this.profileRepository.save(profile)
  }

  async findAll(
    search?: string,
    active?: boolean,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: Profile[]; total: number }> {
    const baseWhere = active === undefined ? {} : { active }
    const where = search
      ? [
          { ...baseWhere, name: Like(`%${search}%`) },
          { ...baseWhere, discipline: Like(`%${search}%`) },
          { ...baseWhere, level: Like(`%${search}%`) },
        ]
      : baseWhere

    const [items, total] = await this.profileRepository.findAndCount({
      where,
      order: { name: 'ASC', level: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { items, total }
  }

  async findOne(id: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { id } })
    if (!profile) {
      throw new NotFoundException('Profile not found')
    }
    return profile
  }

  async findByIdentity(name: string, discipline: string, level: string): Promise<Profile | null> {
    return this.profileRepository.findOne({ where: { name, discipline, level } })
  }

  async update(id: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findOne(id)
    const updated = Object.assign(profile, dto)
    return this.profileRepository.save(updated)
  }
}
