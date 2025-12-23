import { ClassSerializerInterceptor, Controller, Get, Param, ParseUUIDPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { ProjectsService } from './projects.service';
import { ProjectResponseDto } from './dto/project-response.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { TasksService } from '../tasks/tasks.service';
import { TaskResponseDto } from '../tasks/dto/task-response.dto';

@Controller('me/projects')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class UserProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService
  ) {}

  @Get()
  async findMyProjects(@GetUser() user: User): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsService.findForUser(user.id);
    return projects.map(p => plainToInstance(ProjectResponseDto, p, { excludeExtraneousValues: true }));
  }

  @Get(':projectId/tasks')
  async findProjectTasks(
    @GetUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksService.findForUser(user.id, projectId);
    return tasks.map(t => plainToInstance(TaskResponseDto, t, { excludeExtraneousValues: true }));
  }
}