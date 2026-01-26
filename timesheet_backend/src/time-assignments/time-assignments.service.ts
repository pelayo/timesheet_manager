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
    this.ensureWeekStart(dto.weekStart)

    const existing = await this.timeAssignmentsRepository.findOne({
      where: { projectId, userId: dto.userId, weekStart: dto.weekStart },
    })

    if (existing) {
      existing.hours = dto.hours
      await this.timeAssignmentsRepository.save(existing)
      return this.findOne(existing.id)
    }

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
      order: { weekStart: 'ASC' },
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

    if (dto.weekStart) {
      this.ensureWeekStart(dto.weekStart)
    }

    Object.assign(assignment, dto)
    await this.timeAssignmentsRepository.save(assignment)

    return this.findOne(assignment.id)
  }

  async getWeeklySummary(weekStart: string, weeks: number) {
    this.ensureWeekStart(weekStart)
    const weeksCount = Number.isNaN(weeks) ? 12 : Math.min(Math.max(weeks, 1), 52)
    const endDate = this.addDaysUtc(new Date(weekStart), weeksCount * 7 - 1)
    const endDateStr = this.formatDate(endDate)

    const results = await this.timeAssignmentsRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.user', 'user')
      .leftJoin('assignment.project', 'project')
      .select('assignment.userId', 'userId')
      .addSelect('user.email', 'userEmail')
      .addSelect('assignment.projectId', 'projectId')
      .addSelect('project.name', 'projectName')
      .addSelect('assignment.weekStart', 'weekStart')
      .addSelect('assignment.hours', 'hours')
      .where('assignment.weekStart >= :start', { start: weekStart })
      .andWhere('assignment.weekStart <= :end', { end: endDateStr })
      .orderBy('user.email', 'ASC')
      .addOrderBy('assignment.weekStart', 'ASC')
      .addOrderBy('project.name', 'ASC')
      .getRawMany()

    return results.map((row) => ({
      ...row,
      hours: Number(row.hours),
    }))
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.timeAssignmentsRepository.findOne({ where: { id } })
    if (!assignment) {
      throw new NotFoundException('Time assignment not found')
    }
    await this.timeAssignmentsRepository.remove(assignment)
  }

  private ensureWeekStart(weekStart: string) {
    const start = new Date(weekStart)
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid week start date')
    }

    const day = start.getUTCDay()
    if (day !== 1) {
      throw new BadRequestException('Week start must be a Monday')
    }
  }

  private addDaysUtc(date: Date, days: number) {
    const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    next.setUTCDate(next.getUTCDate() + days)
    return next
  }

  private formatDate(date: Date) {
    const year = date.getUTCFullYear()
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    const day = `${date.getUTCDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
