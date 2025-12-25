import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TimeEntry } from '../time-entries/entities/time-entry.entity';
import { ReportFilterDto } from './dto/report-filter.dto';
import { EntityGrouping, StatsFilterDto, TimeGrouping } from './dto/stats-filter.dto';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStats(filter: StatsFilterDto) {
    const cacheKey = `stats:${JSON.stringify(filter)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = this.timeEntryRepository.createQueryBuilder('entry')
      .leftJoin('entry.task', 'task')
      .leftJoin('entry.user', 'user')
      .leftJoin('task.project', 'project');

    query.select([]); // Clear default entity selection for aggregation

    // Filters
    if (filter.from) query.andWhere('entry.workDate >= :from', { from: filter.from });
    if (filter.to) query.andWhere('entry.workDate <= :to', { to: filter.to });
    if (filter.userId) query.andWhere('entry.userId = :userId', { userId: filter.userId });
    if (filter.projectId) query.andWhere('task.projectId = :projectId', { projectId: filter.projectId });
    if (filter.taskId) query.andWhere('entry.taskId = :taskId', { taskId: filter.taskId });

    // Grouping
    const groups: string[] = [];
    const isPostgres = process.env.DB_TYPE === 'postgres';

    // Entity Grouping
    if (filter.groupBy?.includes(EntityGrouping.PROJECT)) {
      query.addSelect('project.name', 'projectName');
      groups.push('project.name');
    }
    if (filter.groupBy?.includes(EntityGrouping.TASK)) {
      query.addSelect('task.name', 'taskName');
      groups.push('task.name');
    }
    if (filter.groupBy?.includes(EntityGrouping.USER)) {
      query.addSelect('user.email', 'userEmail');
      groups.push('user.email');
    }

    // Time Grouping
    if (filter.timeGrouping && filter.timeGrouping !== TimeGrouping.TOTAL) {
        let timeExpr = '';
        if (isPostgres) {
            switch (filter.timeGrouping) {
                case TimeGrouping.DAY: timeExpr = `TO_CHAR(entry.work_date, 'YYYY-MM-DD')`; break;
                case TimeGrouping.WEEK: timeExpr = `TO_CHAR(DATE_TRUNC('week', entry.work_date), 'YYYY-MM-DD')`; break;
                case TimeGrouping.MONTH: timeExpr = `TO_CHAR(DATE_TRUNC('month', entry.work_date), 'YYYY-MM')`; break;
            }
        } else {
            switch (filter.timeGrouping) {
                case TimeGrouping.DAY: timeExpr = `strftime('%Y-%m-%d', entry.work_date)`; break;
                case TimeGrouping.WEEK: timeExpr = `strftime('%Y-%W', entry.work_date)`; break;
                case TimeGrouping.MONTH: timeExpr = `strftime('%Y-%m', entry.work_date)`; break;
            }
        }
        query.addSelect(timeExpr, 'period');
        groups.push(timeExpr);
    }

    if (groups.length === 0) {
        query.addSelect("'Total'", 'label');
    }

    // Ensure numeric totalMinutes
    const sumExpr = isPostgres ? 'SUM(entry.minutes)::INT' : 'SUM(entry.minutes)';
    query.addSelect(sumExpr, 'totalMinutes');
    
    if (groups.length > 0) {
        query.groupBy(groups.join(', '));
        query.orderBy(groups[0], 'ASC'); 
    }

    const result = await query.getRawMany();
    // console.log('Stats Result:', result);
    
    // Cache for 1 hour (3600000 ms) - only in production
    if (process.env.NODE_ENV === 'production') {
        await this.cacheManager.set(cacheKey, result, 3600000);
    }
    return result;
  }

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