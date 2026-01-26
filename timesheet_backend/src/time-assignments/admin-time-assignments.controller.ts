import { BadRequestException, Body, ClassSerializerInterceptor, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { plainToInstance } from 'class-transformer'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { Role } from '../user/entities/role.enum'
import { GetUser } from '../auth/decorators/get-user.decorator'
import { User } from '../user/entities/user.entity'
import { ProjectMembersService } from '../project-members/project-members.service'
import { TimeAssignmentsService } from './time-assignments.service'
import { TimeEntriesService } from '../time-entries/time-entries.service'
import { CreateTimeAssignmentDto } from './dto/create-time-assignment.dto'
import { UpdateTimeAssignmentDto } from './dto/update-time-assignment.dto'
import { TimeAssignmentResponseDto } from './dto/time-assignment-response.dto'
import { TimeAssignmentWeeklySummaryDto } from './dto/time-assignment-weekly-summary.dto'
import { TimeAssignmentTeamworkCumulativeDto } from './dto/time-assignment-teamwork-cumulative.dto'

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin, Role.ProjectManager)
export class AdminTimeAssignmentsController {
  constructor(
    private readonly timeAssignmentsService: TimeAssignmentsService,
    private readonly projectMembersService: ProjectMembersService,
    private readonly timeEntriesService: TimeEntriesService,
  ) {}

  @Post('projects/:projectId/time-assignments')
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTimeAssignmentDto,
    @GetUser() user: User,
  ): Promise<TimeAssignmentResponseDto> {
    await this.ensureCanManage(user, projectId)
    const assignment = await this.timeAssignmentsService.create(projectId, dto)
    return plainToInstance(TimeAssignmentResponseDto, assignment, { excludeExtraneousValues: true })
  }

  @Get('projects/:projectId/time-assignments')
  async findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @GetUser() user: User,
  ): Promise<TimeAssignmentResponseDto[]> {
    await this.ensureCanManage(user, projectId)
    const assignments = await this.timeAssignmentsService.findAll(projectId)
    return assignments.map(assignment =>
      plainToInstance(TimeAssignmentResponseDto, assignment, { excludeExtraneousValues: true }),
    )
  }

  @Patch('time-assignments/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimeAssignmentDto,
    @GetUser() user: User,
  ): Promise<TimeAssignmentResponseDto> {
    const assignment = await this.timeAssignmentsService.findOne(id)
    await this.ensureCanManage(user, assignment.projectId)
    const updated = await this.timeAssignmentsService.update(id, dto)
    return plainToInstance(TimeAssignmentResponseDto, updated, { excludeExtraneousValues: true })
  }

  @Get('time-assignments/weekly-summary')
  @Roles(Role.Admin)
  async weeklySummary(
    @Query('weekStart') weekStart: string,
    @Query('weeks') weeks: string,
    @GetUser() user: User,
  ): Promise<TimeAssignmentWeeklySummaryDto[]> {
    if (!weekStart) {
      throw new BadRequestException('weekStart is required')
    }

    if (user.role !== Role.Admin) {
      throw new ForbiddenException('Not allowed to view assignment summary')
    }

    const weeksCount = Number(weeks) || 12
    const summary = await this.timeAssignmentsService.getWeeklySummary(weekStart, weeksCount)
    return summary.map(item =>
      plainToInstance(TimeAssignmentWeeklySummaryDto, item, { excludeExtraneousValues: true }),
    )
  }

  @Get('time-assignments/teamwork-cumulative')
  @Roles(Role.Admin)
  async teamworkCumulative(
    @Query('weekStart') weekStart: string,
    @GetUser() user: User,
  ): Promise<TimeAssignmentTeamworkCumulativeDto[]> {
    if (!weekStart) {
      throw new BadRequestException('weekStart is required')
    }

    if (user.role !== Role.Admin) {
      throw new ForbiddenException('Not allowed to view teamwork summary')
    }

    const summary = await this.timeEntriesService.getCumulativeTeamworkHours(weekStart)
    return summary.map(item =>
      plainToInstance(TimeAssignmentTeamworkCumulativeDto, item, { excludeExtraneousValues: true }),
    )
  }

  @Delete('time-assignments/:id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    const assignment = await this.timeAssignmentsService.findOne(id)
    await this.ensureCanManage(user, assignment.projectId)
    await this.timeAssignmentsService.remove(id)
  }

  private async ensureCanManage(user: User, projectId: string) {
    if (user.role === Role.Admin) {
      return
    }

    if (user.role !== Role.ProjectManager) {
      throw new ForbiddenException('Not allowed to manage time assignments for this project')
    }

    const isLead = await this.projectMembersService.isProjectLead(projectId, user.id)
    if (!isLead) {
      throw new ForbiddenException('Not allowed to manage time assignments for this project')
    }
  }
}
