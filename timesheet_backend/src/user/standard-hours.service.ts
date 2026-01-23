import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { StandardHours } from './entities/standard-hours.entity'

@Injectable()
export class StandardHoursService {
  constructor(
    @InjectRepository(StandardHours)
    private readonly standardHoursRepository: Repository<StandardHours>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getByUserId(userId: string): Promise<StandardHours | null> {
    return this.standardHoursRepository.findOne({ where: { userId } })
  }

  async upsertForUser(userId: string, hours: number): Promise<StandardHours> {
    const userExists = await this.userRepository.exist({ where: { id: userId } })
    if (!userExists) {
      throw new NotFoundException('User not found')
    }

    const existing = await this.standardHoursRepository.findOne({ where: { userId } })
    if (existing) {
      existing.hours = hours
      return this.standardHoursRepository.save(existing)
    }

    const created = this.standardHoursRepository.create({ userId, hours })
    return this.standardHoursRepository.save(created)
  }
}
