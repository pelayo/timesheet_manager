import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(dto);
    return this.projectRepository.save(project);
  }

  async findAll(search?: string, archived?: boolean): Promise<Project[]> {
    const where: any = {};
    if (archived !== undefined) {
      where.isArchived = archived;
    }
    if (search) {
      where.name = Like(`%${search}%`);
    }
    return this.projectRepository.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    const updated = Object.assign(project, dto);
    return this.projectRepository.save(updated);
  }

  async findForUser(userId: string): Promise<Project[]> {
    const members = await this.memberRepository.find({
      where: { userId },
      relations: ['project'],
    });
    
    return members.map(m => m.project);
  }
}
