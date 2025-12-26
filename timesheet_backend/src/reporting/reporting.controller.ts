import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ReportingService } from './reporting.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { StatsFilterDto } from './dto/stats-filter.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../user/entities/role.enum';

@Controller('admin/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('stats')
  async getStats(@Query() filter: StatsFilterDto) {
    return this.reportingService.getStats(filter);
  }

  @Get('project/:projectId/stats')
  async getProjectStats(
      @Param('projectId') projectId: string,
      @Query('from') from?: string,
      @Query('to') to?: string,
      @Query('groupBy') groupBy?: string,
  ) {
    return this.reportingService.getProjectStats(projectId, from, to, groupBy);
  }

  @Get('worker/:userId/stats')
  async getWorkerStats(
      @Param('userId') userId: string,
      @Query('from') from?: string,
      @Query('to') to?: string,
      @Query('groupBy') groupBy?: string,
  ) {
    return this.reportingService.getWorkerStats(userId, from, to, groupBy);
  }

  @Get('time-entries')
  async getReport(@Query() filter: ReportFilterDto) {
    return this.reportingService.getReport(filter);
  }
}