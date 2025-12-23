import { Body, ClassSerializerInterceptor, Controller, Get, Put, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { TimeEntriesService } from './time-entries.service';
import { TimesheetViewDto } from './dto/timesheet-view.dto';
import { UpdateTimesheetCellDto } from './dto/update-timesheet-cell.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('me/timesheet')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class TimesheetController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Get()
  async getWeeklyTimesheet(
    @GetUser() user: User,
    @Query('weekStart') weekStart: string
  ): Promise<TimesheetViewDto> {
    const timesheet = await this.timeEntriesService.getWeeklyTimesheet(user.id, weekStart);
    return plainToInstance(TimesheetViewDto, timesheet, { excludeExtraneousValues: true });
  }

  @Put('cell')
  async updateCell(
    @GetUser() user: User,
    @Body() dto: UpdateTimesheetCellDto
  ): Promise<void> {
    await this.timeEntriesService.updateTimesheetCell(user.id, dto);
  }
}
