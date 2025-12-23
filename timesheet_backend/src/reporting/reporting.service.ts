import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeEntry } from '../time-entries/entities/time-entry.entity';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
  ) {}

  async getReport(filter: ReportFilterDto) {
    const query = this.timeEntryRepository.createQueryBuilder('entry')
      .leftJoinAndSelect('entry.task', 'task')
      .leftJoinAndSelect('entry.user', 'user')
      .leftJoinAndSelect('task.project', 'project');

    this.applyFilters(query, filter);
    
    if (filter.groupBy) {
        const groupField = this.getGroupField(filter.groupBy);
        if (groupField) {
            query.select(groupField, 'group')
                 .addSelect('SUM(entry.minutes)', 'totalMinutes')
                 .groupBy(groupField);
            return query.getRawMany();
        }
    }

    query.orderBy('entry.workDate', 'DESC');
    return query.getMany();
  }

  async exportCsv(filter: ReportFilterDto): Promise<string> {
    const query = this.timeEntryRepository.createQueryBuilder('entry')
      .leftJoinAndSelect('entry.task', 'task')
      .leftJoinAndSelect('entry.user', 'user')
      .leftJoinAndSelect('task.project', 'project');

    this.applyFilters(query, filter);
    query.orderBy('entry.workDate', 'DESC');
    
    const entries = await query.getMany();
    
    const header = 'date,userId,userEmail,projectId,projectName,taskId,taskName,minutes,hoursDecimal,notes\n';
    const rows = entries.map(e => {
        const hours = (e.minutes / 60).toFixed(2);
        const notes = (e.notes || '').replace(new RegExp('"', 'g'), '""');
        return `${e.workDate},${e.userId},${e.user.email},${e.task.projectId},${e.task.project.name},${e.taskId},${e.task.name},${e.minutes},${hours},"${notes}"`;
    }).join('\n');
    
    return header + rows;
  }

  private applyFilters(query: any, filter: ReportFilterDto) {
    if (filter.from) {
      query.andWhere('entry.workDate >= :from', { from: filter.from });
    }
    if (filter.to) {
      query.andWhere('entry.workDate <= :to', { to: filter.to });
    }
    if (filter.userId) {
      query.andWhere('entry.userId = :userId', { userId: filter.userId });
    }
    if (filter.projectId) {
      query.andWhere('task.projectId = :projectId', { projectId: filter.projectId });
    }
    if (filter.taskId) {
      query.andWhere('entry.taskId = :taskId', { taskId: filter.taskId });
    }
  }

  private getGroupField(groupBy: string): string | null {
      switch (groupBy) {
          case 'user': return 'entry.userId';
          case 'project': return 'task.projectId';
          case 'task': return 'entry.taskId';
          case 'day': return 'entry.workDate';
          default: return null;
      }
  }
}
