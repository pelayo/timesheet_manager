import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TimeEntry } from '../time-entries/entities/time-entry.entity';
import { DatalakeEntry } from '../datalake/entities/datalake-entry.entity';
import { ReportFilterDto } from './dto/report-filter.dto';
import { EntityGrouping, StatsFilterDto, TimeGrouping } from './dto/stats-filter.dto';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(DatalakeEntry)
    private readonly datalakeRepository: Repository<DatalakeEntry>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStats(filter: StatsFilterDto) {
    const cacheKey = `stats:${JSON.stringify(filter)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = this.datalakeRepository.createQueryBuilder('entry')
      .leftJoin('entry.task', 'task')
      .leftJoin('entry.user', 'user')
      .leftJoin('entry.project', 'project');

    query.select([]); // Clear default entity selection for aggregation

    // Filters
    if (filter.from) query.andWhere('entry.date >= :from', { from: filter.from });
    if (filter.to) query.andWhere('entry.date <= :to', { to: filter.to });
    if (filter.userId) query.andWhere('entry.userId = :userId', { userId: filter.userId });
    if (filter.projectId) query.andWhere('entry.projectId = :projectId', { projectId: filter.projectId });
    if (filter.taskId) query.andWhere('entry.taskId = :taskId', { taskId: filter.taskId });

    // Grouping
    const groups: string[] = [];
    
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

    // Time Grouping - Use pre-calculated columns
    if (filter.timeGrouping && filter.timeGrouping !== TimeGrouping.TOTAL) {
        let timeExpr = '';
        switch (filter.timeGrouping) {
            case TimeGrouping.DAY: timeExpr = 'entry.date'; break;
            case TimeGrouping.WEEK: timeExpr = 'entry.week'; break;
            case TimeGrouping.MONTH: timeExpr = 'entry.month'; break;
        }
        
        if (timeExpr) {
             query.addSelect(timeExpr, 'period');
             groups.push(timeExpr);
        }
    }

    if (groups.length === 0) {
        query.addSelect("'Total'", 'label');
    }

    // Sum minutes
    // Use simple SUM since datalake has numbers
    query.addSelect('SUM(entry.minutes)', 'totalMinutes');
    
    if (groups.length > 0) {
        query.groupBy(groups.join(', '));
        // Order by first group
        query.orderBy(groups[0], 'ASC'); 
    }

    const result = await query.getRawMany();
    // Parse totalMinutes to int
    result.forEach(r => {
        r.totalMinutes = parseInt(r.totalMinutes, 10);
    });
    
    // Cache for 1 hour (3600000 ms) - only in production
    if (process.env.NODE_ENV === 'production') {
        await this.cacheManager.set(cacheKey, result, 3600000);
    }
    return result;
  }

  async getProjectStats(projectId: string, from?: string, to?: string, groupBy: string = 'day') {
    const cacheKey = `project-stats:${projectId}:${from || 'all'}:${to || 'all'}:${groupBy}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const dateGroup = groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';
    const query = this.timeEntryRepository.createQueryBuilder('entry')
      .leftJoin('entry.task', 'task')
      .leftJoin('entry.user', 'user')
      .select(`DATE_TRUNC('${dateGroup}', entry.workDate)::DATE`, 'date')
      .addSelect('user.email', 'userEmail')
      .addSelect('SUM(entry.minutes)', 'minutes')
      .where('task.projectId = :projectId', { projectId });

    if (from) {
        query.andWhere('entry.workDate >= :from', { from });
    }
    if (to) {
        query.andWhere('entry.workDate <= :to', { to });
    }

    const result = await query
      .groupBy('date')
      .addGroupBy('user.email')
      .orderBy('date', 'ASC')
      .getRawMany();
      
    // Parse minutes
    result.forEach(r => r.minutes = parseInt(r.minutes, 10));

    // Cache for 15 minutes (900000 ms)
    await this.cacheManager.set(cacheKey, result, 900000);
    return result;
  }

  async getWorkerStats(userId: string, from?: string, to?: string, groupBy: string = 'day') {
    const cacheKey = `worker-stats:${userId}:${from || 'all'}:${to || 'all'}:${groupBy}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const dateGroup = groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';
    const query = this.timeEntryRepository.createQueryBuilder('entry')
      .leftJoin('entry.task', 'task')
      .leftJoin('task.project', 'project')
      .select(`DATE_TRUNC('${dateGroup}', entry.workDate)::DATE`, 'date')
      .addSelect('project.name', 'projectName')
      .addSelect('SUM(entry.minutes)', 'minutes')
      .where('entry.userId = :userId', { userId });

    if (from) {
        query.andWhere('entry.workDate >= :from', { from });
    }
    if (to) {
        query.andWhere('entry.workDate <= :to', { to });
    }

    const result = await query
      .groupBy('date')
      .addGroupBy('project.name')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Parse minutes
    result.forEach(r => r.minutes = parseInt(r.minutes, 10));

    // Cache for 15 minutes (900000 ms)
    await this.cacheManager.set(cacheKey, result, 900000);
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