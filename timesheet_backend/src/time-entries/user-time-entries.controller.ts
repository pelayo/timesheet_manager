import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { TimeEntryResponseDto } from './dto/time-entry-response.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('me/time-entries')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class UserTimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post()
  async create(
    @GetUser() user: User,
    @Body() dto: CreateTimeEntryDto
  ): Promise<TimeEntryResponseDto> {
    const entry = await this.timeEntriesService.create(user.id, dto);
    return plainToInstance(TimeEntryResponseDto, entry, { excludeExtraneousValues: true });
  }

  @Get()
  async findAll(
    @GetUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('projectId') projectId?: string
  ): Promise<TimeEntryResponseDto[]> {
    const entries = await this.timeEntriesService.findAllForUser(user.id, from, to, projectId);
    return entries.map(e => plainToInstance(TimeEntryResponseDto, e, { excludeExtraneousValues: true }));
  }

  @Patch(':id')
  async update(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimeEntryDto
  ): Promise<TimeEntryResponseDto> {
    const entry = await this.timeEntriesService.update(id, user.id, dto);
    return plainToInstance(TimeEntryResponseDto, entry, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  async delete(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this.timeEntriesService.delete(id, user.id);
  }
}
