import { Body, ClassSerializerInterceptor, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../user/entities/role.enum';
import { TaskStatus } from './entities/task.entity';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin)
export class AdminTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:projectId/tasks')
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.create(projectId, dto);
    return plainToInstance(TaskResponseDto, task, { excludeExtraneousValues: true });
  }

  @Get('projects/:projectId/tasks')
  async findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('status') status?: TaskStatus
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksService.findAll(projectId, status);
    return tasks.map(t => plainToInstance(TaskResponseDto, t, { excludeExtraneousValues: true }));
  }

  @Patch('tasks/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.update(id, dto);
    return plainToInstance(TaskResponseDto, task, { excludeExtraneousValues: true });
  }

  @Post('tasks/:id/close')
  async close(@Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
    const task = await this.tasksService.close(id);
    return plainToInstance(TaskResponseDto, task, { excludeExtraneousValues: true });
  }

  @Post('tasks/:id/reopen')
  async reopen(@Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
    const task = await this.tasksService.reopen(id);
    return plainToInstance(TaskResponseDto, task, { excludeExtraneousValues: true });
  }
}
