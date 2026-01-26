import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportingService } from './reporting.service';
import { LeadTeamHoursFilterDto } from './dto/lead-team-hours-filter.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('me/stats')
@UseGuards(AuthGuard('jwt'))
export class UserReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get()
  async getMyStats(
      @GetUser() user: User,
      @Query('from') from?: string,
      @Query('to') to?: string,
      @Query('groupBy') groupBy: string = 'day',
  ) {
    return this.reportingService.getWorkerStats(user.id, from, to, groupBy);
  }

  @Get('projects/:projectId/team-hours')
  async getProjectTeamHours(
    @GetUser() user: User,
    @Param('projectId') projectId: string,
    @Query() filter: LeadTeamHoursFilterDto,
  ) {
    return this.reportingService.getLeadTeamHours(projectId, user, filter);
  }
}
