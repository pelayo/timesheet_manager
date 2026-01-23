import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Profile } from './entities/profile.entity'

type ProfileSeed = Pick<Profile, 'name' | 'discipline' | 'level' | 'costPerHour' | 'active'>

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async findByName(name: string): Promise<Profile | null> {
    return this.profileRepository.findOne({ where: { name } })
  }

  async create(profile: ProfileSeed): Promise<Profile> {
    const entity = this.profileRepository.create(profile)
    return this.profileRepository.save(entity)
  }
}
