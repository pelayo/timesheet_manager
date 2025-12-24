import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectMember } from '../project-members/entities/project-member.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
  ) {}

  async create(projectId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      ...dto,
      projectId,
    });
    return this.taskRepository.save(task);
  }

  async findAll(projectId: string, status?: TaskStatus): Promise<Task[]> {
    const where: any = { projectId };
    if (status) {
      where.status = status;
    }
    return this.taskRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    const updated = Object.assign(task, dto);
    return this.taskRepository.save(updated);
  }

  async close(id: string): Promise<Task> {
    const task = await this.findOne(id);
    task.status = TaskStatus.CLOSED;
    task.closedAt = new Date();
    return this.taskRepository.save(task);
  }

  async reopen(id: string): Promise<Task> {
    const task = await this.findOne(id);
    task.status = TaskStatus.OPEN;
    task.closedAt = null;
    return this.taskRepository.save(task);
  }

  async findForUser(userId: string, projectId: string): Promise<Task[]> {
    const membership = await this.memberRepository.findOne({ where: { userId, projectId } });
    if (!membership) {
       const project = await this.projectRepository.findOne({ where: { id: projectId } });
       if (!project || !project.isGlobal) {
           throw new ForbiddenException('Not a member of this project');
       }
    }
    
    return this.taskRepository.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }
}
