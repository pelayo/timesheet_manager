import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { TimesheetViewDto, TimesheetRowDto } from './dto/timesheet-view.dto';
import { UpdateTimesheetCellDto } from './dto/update-timesheet-cell.dto';

@Injectable()
export class TimeEntriesService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
  ) {}

  async create(userId: string, dto: CreateTimeEntryDto): Promise<TimeEntry> {
    const task = await this.taskRepository.findOne({ where: { id: dto.taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status === TaskStatus.CLOSED) {
      throw new BadRequestException('Cannot log time to a closed task');
    }

    const member = await this.memberRepository.findOne({
      where: { userId, projectId: task.projectId },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const existing = await this.timeEntryRepository.findOne({
        where: { userId, taskId: dto.taskId, workDate: dto.workDate }
    });
    if (existing) {
        throw new BadRequestException('Time entry already exists for this task and date');
    }

    const entry = this.timeEntryRepository.create({
      userId,
      ...dto,
    });
    return this.timeEntryRepository.save(entry);
  }

  async findAllForUser(userId: string, from?: string, to?: string, projectId?: string): Promise<TimeEntry[]> {
    const query = this.timeEntryRepository.createQueryBuilder('entry')
      .leftJoinAndSelect('entry.task', 'task')
      .leftJoinAndSelect('task.project', 'project')
      .where('entry.userId = :userId', { userId });

    if (from) {
      query.andWhere('entry.workDate >= :from', { from });
    }
    if (to) {
      query.andWhere('entry.workDate <= :to', { to });
    }
    if (projectId) {
      query.andWhere('task.projectId = :projectId', { projectId });
    }

    query.orderBy('entry.workDate', 'DESC');
    return query.getMany();
  }

  async findAll(from?: string, to?: string, userId?: string, projectId?: string): Promise<TimeEntry[]> {
    const query = this.timeEntryRepository.createQueryBuilder('entry')
      .leftJoinAndSelect('entry.task', 'task')
      .leftJoinAndSelect('entry.user', 'user')
      .leftJoinAndSelect('task.project', 'project');

    if (from) {
      query.andWhere('entry.workDate >= :from', { from });
    }
    if (to) {
      query.andWhere('entry.workDate <= :to', { to });
    }
    if (userId) {
      query.andWhere('entry.userId = :userId', { userId });
    }
    if (projectId) {
      query.andWhere('task.projectId = :projectId', { projectId });
    }

    query.orderBy('entry.workDate', 'DESC');
    return query.getMany();
  }

  async findOne(id: string): Promise<TimeEntry> {
    const entry = await this.timeEntryRepository.findOne({
      where: { id },
      relations: ['task', 'user'],
    });
    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }
    return entry;
  }

  async update(id: string, userId: string, dto: UpdateTimeEntryDto): Promise<TimeEntry> {
    const entry = await this.findOne(id);
    
    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only update your own time entries');
    }

    const task = await this.taskRepository.findOne({ where: { id: entry.taskId } });
    if (task && task.status === TaskStatus.CLOSED) {
        throw new BadRequestException('Cannot update time entry for a closed task');
    }

    const updated = Object.assign(entry, dto);
    return this.timeEntryRepository.save(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const entry = await this.findOne(id);
    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only delete your own time entries');
    }
    
    const task = await this.taskRepository.findOne({ where: { id: entry.taskId } });
    if (task && task.status === TaskStatus.CLOSED) {
        throw new BadRequestException('Cannot delete time entry for a closed task');
    }

    await this.timeEntryRepository.remove(entry);
  }

  async getWeeklyTimesheet(userId: string, weekStart: string): Promise<TimesheetViewDto> {
    const startDate = new Date(weekStart);
    if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid weekStart date');
    }
    
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        days.push(d.toISOString().split('T')[0]);
    }
    const endDateStr = days[6];

    const entries = await this.timeEntryRepository.createQueryBuilder('entry')
        .leftJoinAndSelect('entry.task', 'task')
        .leftJoinAndSelect('task.project', 'project')
        .where('entry.userId = :userId', { userId })
        .andWhere('entry.workDate >= :start', { start: weekStart })
        .andWhere('entry.workDate <= :end', { end: endDateStr })
        .getMany();

    const memberships = await this.memberRepository.find({ where: { userId }, relations: ['project'] });
    const projectIds = memberships.map(m => m.projectId);
    
    let allTasks: Task[] = [];
    if (projectIds.length > 0) {
        allTasks = await this.taskRepository.createQueryBuilder('task')
            .leftJoinAndSelect('task.project', 'project')
            .where('task.projectId IN (:...ids)', { ids: projectIds })
            .andWhere('task.status = :status', { status: TaskStatus.OPEN })
            .getMany();
    }
    
    const taskMap = new Map<string, Task>();
    allTasks.forEach(t => taskMap.set(t.id, t));
    
    entries.forEach(e => {
        if (!taskMap.has(e.taskId)) {
            taskMap.set(e.taskId, e.task);
        }
    });

    const rows: TimesheetRowDto[] = [];
    const sortedTasks = Array.from(taskMap.values()).sort((a, b) => {
        const pCompare = a.project.name.localeCompare(b.project.name);
        if (pCompare !== 0) return pCompare;
        return a.name.localeCompare(b.name);
    });

    const totalsByDay: Record<string, number> = {};
    days.forEach(d => totalsByDay[d] = 0);
    let totalWeek = 0;

    for (const task of sortedTasks) {
        const row: TimesheetRowDto = {
            projectId: task.projectId,
            projectName: task.project.name,
            taskId: task.id,
            taskName: task.name,
            isClosed: task.status === TaskStatus.CLOSED,
            minutesByDay: {},
        };
        
        days.forEach(d => row.minutesByDay[d] = 0);
        
        const taskEntries = entries.filter(e => e.taskId === task.id);
        taskEntries.forEach(e => {
            const dateStr = typeof e.workDate === 'string' ? e.workDate : (e.workDate as Date).toISOString().split('T')[0];
            if (days.includes(dateStr)) {
                row.minutesByDay[dateStr] = e.minutes;
                totalsByDay[dateStr] += e.minutes;
                totalWeek += e.minutes;
            }
        });
        
        rows.push(row);
    }

    return {
        weekStart,
        days,
        rows,
        totalsByDay,
        totalWeek,
    };
  }

  async updateTimesheetCell(userId: string, dto: UpdateTimesheetCellDto): Promise<void> {
    const { taskId, workDate, minutes } = dto;
    
    const existing = await this.timeEntryRepository.findOne({
        where: { userId, taskId, workDate }
    });

    if (minutes === 0) {
        if (existing) {
            const task = await this.taskRepository.findOne({ where: { id: taskId } });
             if (task && task.status === TaskStatus.CLOSED) {
                 throw new BadRequestException('Cannot remove time from closed task');
             }
            await this.timeEntryRepository.remove(existing);
        }
        return;
    }

    if (existing) {
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (task && task.status === TaskStatus.CLOSED) {
            throw new BadRequestException('Cannot update closed task');
        }
        existing.minutes = minutes;
        await this.timeEntryRepository.save(existing);
    } else {
        const createDto = {
            taskId,
            workDate,
            minutes,
            notes: '',
        };
        await this.create(userId, createDto);
    }
  }
}
