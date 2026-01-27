import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TimeEntry } from '../time-entries/entities/time-entry.entity';
import { DatalakeEntry } from '../datalake/entities/datalake-entry.entity';
import {
  ProjectMember,
  ProjectRole,
} from '../project-members/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { StandardHours } from '../user/entities/standard-hours.entity';
import { User } from '../user/entities/user.entity';
import { ReportFilterDto } from './dto/report-filter.dto';
import {
  EntityGrouping,
  StatsFilterDto,
  TimeGrouping,
} from './dto/stats-filter.dto';
import { TeamHoursFilterDto } from './dto/team-hours-filter.dto';

interface CostSummary {
  chargeableMinutes: number;
  chargeableHours: number;
  nonChargeableMinutes: number;
  nonChargeableHours: number;
}

interface TeamMemberSummary {
  memberId: string;
  memberEmail: string | null;
  totalMinutes: number;
  totalHours: number;
  standardHours: number | null;
  thresholdHours: number | null;
  overThreshold: boolean;
  chargeableMinutes: number;
  chargeableHours: number;
  nonChargeableMinutes: number;
  nonChargeableHours: number;
  costSummary: CostSummary | null;
}

interface TeamLeadSummary {
  leadId: string;
  leadEmail: string | null;
  totalMinutes: number;
  totalHours: number;
  chargeableMinutes: number;
  chargeableHours: number;
  nonChargeableMinutes: number;
  nonChargeableHours: number;
  costSummary: CostSummary | null;
  members: TeamMemberSummary[];
}

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

    const query = this.datalakeRepository
      .createQueryBuilder('entry')
      .leftJoin('entry.task', 'task')
      .leftJoin('entry.user', 'user')
      .leftJoin('entry.project', 'project');

    query.select([]); // Clear default entity selection for aggregation

    // Filters
    if (filter.from)
      query.andWhere('entry.date >= :from', { from: filter.from });
    if (filter.to) query.andWhere('entry.date <= :to', { to: filter.to });
    if (filter.userId)
      query.andWhere('entry.userId = :userId', { userId: filter.userId });
    if (filter.projectId)
      query.andWhere('entry.projectId = :projectId', {
        projectId: filter.projectId,
      });
    if (filter.taskId)
      query.andWhere('entry.taskId = :taskId', { taskId: filter.taskId });

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
        case TimeGrouping.DAY:
          timeExpr = 'entry.date';
          break;
        case TimeGrouping.WEEK:
          timeExpr = 'entry.week';
          break;
        case TimeGrouping.MONTH:
          timeExpr = 'entry.month';
          break;
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
    result.forEach((r) => {
      r.totalMinutes = parseInt(r.totalMinutes, 10);
    });

    // Cache for 1 hour (3600000 ms) - only in production
    if (process.env.NODE_ENV === 'production') {
      await this.cacheManager.set(cacheKey, result, 3600000);
    }
    return result;
  }

  async getProjectStats(
    projectId: string,
    from?: string,
    to?: string,
    groupBy: string = 'day',
  ) {
    const cacheKey = `project-stats:${projectId}:${from || 'all'}:${to || 'all'}:${groupBy}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const dateGroup =
      groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';
    const query = this.timeEntryRepository
      .createQueryBuilder('entry')
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
    result.forEach((r) => (r.minutes = parseInt(r.minutes, 10)));

    // Cache for 15 minutes (900000 ms)
    await this.cacheManager.set(cacheKey, result, 900000);
    return result;
  }

  async getWorkerStats(
    userId: string,
    from?: string,
    to?: string,
    groupBy: string = 'day',
  ) {
    const cacheKey = `worker-stats:${userId}:${from || 'all'}:${to || 'all'}:${groupBy}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const dateGroup =
      groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';
    const query = this.timeEntryRepository
      .createQueryBuilder('entry')
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
    result.forEach((r) => (r.minutes = parseInt(r.minutes, 10)));

    // Cache for 15 minutes (900000 ms)
    await this.cacheManager.set(cacheKey, result, 900000);
    return result;
  }

  async getReport(filter: ReportFilterDto) {
    const query = this.timeEntryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.task', 'task')
      .leftJoinAndSelect('entry.user', 'user')
      .leftJoinAndSelect('task.project', 'project');

    this.applyFilters(query, filter);

    if (filter.groupBy) {
      const groupField = this.getGroupField(filter.groupBy);
      if (groupField) {
        query
          .select(groupField, 'group')
          .addSelect('SUM(entry.minutes)', 'totalMinutes')
          .groupBy(groupField);
        return query.getRawMany();
      }
    }

    query.orderBy('entry.workDate', 'DESC');
    return query.getMany();
  }

  async getChargeableSummary(filter: ReportFilterDto) {
    const query = this.timeEntryRepository
      .createQueryBuilder('entry')
      .leftJoin('entry.task', 'task')
      .leftJoin('task.project', 'project')
      .select('project.isChargeable', 'isChargeable')
      .addSelect('SUM(entry.minutes)', 'totalMinutes');

    this.applyFilters(query, filter);

    const result = await query.groupBy('project.isChargeable').getRawMany();

    let chargeableMinutes = 0;
    let nonChargeableMinutes = 0;

    result.forEach((r) => {
      const isChargeable = this.parseBoolean(r.isChargeable);
      const minutes = parseInt(r.totalMinutes, 10) || 0;
      if (isChargeable) {
        chargeableMinutes += minutes;
      } else {
        nonChargeableMinutes += minutes;
      }
    });

    return { chargeableMinutes, nonChargeableMinutes };
  }

  async getTeamHoursByLead(filter: TeamHoursFilterDto) {
    const cacheKey = `team-hours:${JSON.stringify(filter)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = this.datalakeRepository
      .createQueryBuilder('entry')
      .innerJoin(
        ProjectMember,
        'leadMember',
        'leadMember.projectId = entry.projectId AND leadMember.role = :leadRole',
        { leadRole: ProjectRole.LEAD },
      )
      .leftJoin(User, 'leadUser', 'leadUser.id = leadMember.userId')
      .leftJoin(User, 'memberUser', 'memberUser.id = entry.userId')
      .leftJoin(Project, 'project', 'project.id = entry.projectId')
      .leftJoin(
        StandardHours,
        'standardHours',
        'standardHours.userId = entry.userId',
      )
      .select('leadMember.userId', 'leadId')
      .addSelect('leadUser.email', 'leadEmail')
      .addSelect('entry.userId', 'memberId')
      .addSelect('memberUser.email', 'memberEmail')
      .addSelect('SUM(entry.minutes)', 'totalMinutes')
      .addSelect(
        'SUM(CASE WHEN project.isChargeable THEN entry.minutes ELSE 0 END)',
        'chargeableMinutes',
      )
      .addSelect(
        'SUM(CASE WHEN project.isChargeable THEN 0 ELSE entry.minutes END)',
        'nonChargeableMinutes',
      )
      .addSelect('standardHours.hours', 'standardHours');

    if (filter.from)
      query.andWhere('entry.date >= :from', { from: filter.from });
    if (filter.to) query.andWhere('entry.date <= :to', { to: filter.to });
    if (filter.leadId)
      query.andWhere('leadMember.userId = :leadId', { leadId: filter.leadId });
    if (filter.projectId)
      query.andWhere('entry.projectId = :projectId', {
        projectId: filter.projectId,
      });

    const rows = await query
      .groupBy('leadMember.userId')
      .addGroupBy('leadUser.email')
      .addGroupBy('entry.userId')
      .addGroupBy('memberUser.email')
      .addGroupBy('standardHours.hours')
      .orderBy('leadUser.email', 'ASC')
      .addOrderBy('memberUser.email', 'ASC')
      .getRawMany();

    const thresholdOverride = this.parseOptionalNumber(filter.thresholdHours);
    const windowMultiplier = this.getWindowMultiplier(filter.from, filter.to);
    const leads = new Map<string, TeamLeadSummary>();

    rows.forEach((row) => {
      const leadId = this.parseString(row.leadId);
      const memberId = this.parseString(row.memberId);
      if (!leadId || !memberId) {
        return;
      }

      const leadEmail = this.parseString(row.leadEmail);
      const memberEmail = this.parseString(row.memberEmail);
      const totalMinutes = this.parseNumber(row.totalMinutes);
      const chargeableMinutes = this.parseNumber(row.chargeableMinutes);
      const nonChargeableMinutes = this.parseNumber(row.nonChargeableMinutes);
      const standardHours = this.parseOptionalNumber(row.standardHours);
      const thresholdHours =
        thresholdOverride ??
        this.calculateWindowThreshold(standardHours, windowMultiplier);
      const totalHours = this.toHours(totalMinutes);
      const overThreshold =
        thresholdHours === null ? false : totalHours > thresholdHours;

      let lead = leads.get(leadId);
      if (!lead) {
        lead = {
          leadId,
          leadEmail,
          totalMinutes: 0,
          totalHours: 0,
          chargeableMinutes: 0,
          chargeableHours: 0,
          nonChargeableMinutes: 0,
          nonChargeableHours: 0,
          costSummary: null,
          members: [],
        };
        leads.set(leadId, lead);
      }

      lead.totalMinutes += totalMinutes;
      lead.totalHours = this.toHours(lead.totalMinutes);
      lead.chargeableMinutes += chargeableMinutes;
      lead.chargeableHours = this.toHours(lead.chargeableMinutes);
      lead.nonChargeableMinutes += nonChargeableMinutes;
      lead.nonChargeableHours = this.toHours(lead.nonChargeableMinutes);
      lead.costSummary = this.buildCostSummary(
        lead.chargeableMinutes,
        lead.nonChargeableMinutes,
      );
      lead.members.push({
        memberId,
        memberEmail,
        totalMinutes,
        totalHours,
        standardHours,
        thresholdHours,
        overThreshold,
        chargeableMinutes,
        chargeableHours: this.toHours(chargeableMinutes),
        nonChargeableMinutes,
        nonChargeableHours: this.toHours(nonChargeableMinutes),
        costSummary: this.buildCostSummary(
          chargeableMinutes,
          nonChargeableMinutes,
        ),
      });
    });

    const result = Array.from(leads.values());
    await this.cacheManager.set(cacheKey, result, 900000);
    return result;
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
      query.andWhere('task.projectId = :projectId', {
        projectId: filter.projectId,
      });
    }
    if (filter.taskId) {
      query.andWhere('entry.taskId = :taskId', { taskId: filter.taskId });
    }
  }

  private parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value === 'true' || value === '1';
    return false;
  }

  private getGroupField(groupBy: string): string | null {
    switch (groupBy) {
      case 'user':
        return 'entry.userId';
      case 'project':
        return 'task.projectId';
      case 'task':
        return 'entry.taskId';
      case 'day':
        return 'entry.workDate';
      default:
        return null;
    }
  }

  private parseOptionalNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  private parseNumber(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isNaN(value) ? 0 : value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  private parseString(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    return null;
  }

  private toHours(minutes: number): number {
    return Number((minutes / 60).toFixed(2));
  }

  private getWindowMultiplier(from?: string, to?: string): number | null {
    if (!from || !to) {
      return null;
    }

    const fromDate = this.parseDate(from);
    const toDate = this.parseDate(to);
    if (!fromDate || !toDate) {
      return null;
    }

    if (toDate.getTime() < fromDate.getTime()) {
      return null;
    }

    const diffMs = toDate.getTime() - fromDate.getTime();
    const days = Math.floor(diffMs / 86400000) + 1;
    return days / 7;
  }

  private calculateWindowThreshold(
    standardHours: number | null,
    windowMultiplier: number | null,
  ): number | null {
    if (standardHours === null || windowMultiplier === null) {
      return null;
    }

    return Number((standardHours * windowMultiplier).toFixed(2));
  }

  private parseDate(date: string): Date | null {
    const parts = date.split('-');
    if (parts.length !== 3) {
      return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!year || !month || !day) {
      return null;
    }

    return new Date(Date.UTC(year, month - 1, day));
  }

  private buildCostSummary(
    chargeableMinutes: number,
    nonChargeableMinutes: number,
  ) {
    if (chargeableMinutes === 0 && nonChargeableMinutes === 0) {
      return null;
    }

    return {
      chargeableMinutes,
      chargeableHours: this.toHours(chargeableMinutes),
      nonChargeableMinutes,
      nonChargeableHours: this.toHours(nonChargeableMinutes),
    };
  }
}
