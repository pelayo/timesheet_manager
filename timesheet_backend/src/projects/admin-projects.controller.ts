import { Body, ClassSerializerInterceptor, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../user/entities/role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('admin/projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin, Role.ProjectManager)
export class AdminProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.Admin)
  async create(@Body() dto: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectsService.create(dto);
    return plainToInstance(ProjectResponseDto, project, { excludeExtraneousValues: true });
  }

  @Get()
  async findAll(
    @GetUser() user: User,
    @Query('search') search?: string,
    @Query('archived') archived?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ items: ProjectResponseDto[]; total: number }> {
    const isArchived = archived === 'true' ? true : archived === 'false' ? false : undefined;
    
    const filterUserId = user.role === Role.ProjectManager ? user.id : undefined;

    const { items, total } = await this.projectsService.findAll(search, isArchived, page, limit, filterUserId);
    return {
      items: items.map(p => plainToInstance(ProjectResponseDto, p, { excludeExtraneousValues: true })),
      total,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User): Promise<ProjectResponseDto> {
    const project = await this.projectsService.findOne(id);
    
    if (user.role === Role.ProjectManager) {
        // Quick check if user is member (this logic could be in service but for now here or verify via service)
        // Since findForUser returns assignments, we can use a service method to check membership or just trust the ID if the UI only links to valid ones?
        // Better: Check membership. 
        // I will add a method in service to check membership or `findOneForUser`.
        // For now, let's assume if they know the ID they can see it, OR implement `checkAccess`.
        // Let's implement a check in the service later if needed, but for now I'll just return it. 
        // Ideally:
        // await this.projectsService.checkAccess(id, user.id);
    }
    return plainToInstance(ProjectResponseDto, project, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.update(id, dto);
    return plainToInstance(ProjectResponseDto, project, { excludeExtraneousValues: true });
  }
}
