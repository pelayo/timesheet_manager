import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TimeAssignment } from './entities/time-assignment.entity'
import { CreateTimeAssignmentDto } from './dto/create-time-assignment.dto'
import { UpdateTimeAssignmentDto } from './dto/update-time-assignment.dto'

@Injectable()
export class TimeAssignmentsService {
  constructor(
    @InjectRepository(TimeAssignment)
    private readonly timeAssignmentsRepository: Repository<TimeAssignment>,
  ) {}

  async create(projectId: string, dto: CreateTimeAssignmentDto): Promise<TimeAssignment> {
    this.ensureDateRange(dto.startDate, dto.endDate)

    const assignment = this.timeAssignmentsRepository.create({
      projectId,
      ...dto,
    })

    await this.timeAssignmentsRepository.save(assignment)
    return this.findOne(assignment.id)
  }

  async findAll(projectId: string): Promise<TimeAssignment[]> {
    return this.timeAssignmentsRepository.find({
      where: { projectId },
      relations: ['user'],
      order: { startDate: 'ASC', endDate: 'ASC' },
    })
  }

  async findOne(id: string): Promise<TimeAssignment> {
    const assignment = await this.timeAssignmentsRepository.findOne({
      where: { id },
      relations: ['user'],
    })

    if (!assignment) {
      throw new NotFoundException('Time assignment not found')
    }

    return assignment
  }

  async update(id: string, dto: UpdateTimeAssignmentDto): Promise<TimeAssignment> {
    const assignment = await this.timeAssignmentsRepository.findOne({ where: { id } })

    if (!assignment) {
      throw new NotFoundException('Time assignment not found')
    }

    const nextStart = dto.startDate ?? assignment.startDate
    const nextEnd = dto.endDate ?? assignment.endDate
    this.ensureDateRange(nextStart, nextEnd)

    Object.assign(assignment, dto)
    await this.timeAssignmentsRepository.save(assignment)

    return this.findOne(assignment.id)
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.timeAssignmentsRepository.findOne({ where: { id } })
    if (!assignment) {
      throw new NotFoundException('Time assignment not found')
    }
    await this.timeAssignmentsRepository.remove(assignment)
  }

  private ensureDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      throw new BadRequestException('Start date must be on or before end date')
    }
  }
}
