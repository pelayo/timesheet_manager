import { Body, ClassSerializerInterceptor, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../user/entities/role.enum';

@Controller('admin/projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin)
export class AdminProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() dto: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectsService.create(dto);
    return plainToInstance(ProjectResponseDto, project, { excludeExtraneousValues: true });
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('archived') archived?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ items: ProjectResponseDto[]; total: number }> {
    const isArchived = archived === 'true' ? true : archived === 'false' ? false : undefined;
    const { items, total } = await this.projectsService.findAll(search, isArchived, page, limit);
    return {
      items: items.map(p => plainToInstance(ProjectResponseDto, p, { excludeExtraneousValues: true })),
      total,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProjectResponseDto> {
    const project = await this.projectsService.findOne(id);
    return plainToInstance(ProjectResponseDto, project, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.update(id, dto);
    return plainToInstance(ProjectResponseDto, project, { excludeExtraneousValues: true });
  }
}
