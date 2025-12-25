import { ClassSerializerInterceptor, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntryResponseDto } from './dto/time-entry-response.dto';
import { TimeEntryListResponseDto } from './dto/time-entry-list-response.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../user/entities/role.enum';

@Controller('admin/time-entries')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin)
export class AdminTimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Get()
  async findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ): Promise<TimeEntryListResponseDto> {
    const { data, total } = await this.timeEntriesService.findAll(from, to, userId, projectId, page, limit);
    
    return plainToInstance(TimeEntryListResponseDto, {
        data,
        total,
        page,
        limit
    }, { excludeExtraneousValues: true });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TimeEntryResponseDto> {
    const entry = await this.timeEntriesService.findOne(id);
    return plainToInstance(TimeEntryResponseDto, entry, { excludeExtraneousValues: true });
  }
}
