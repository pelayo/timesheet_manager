import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { TasksService } from './tasks.service';
import { AdminTasksController } from './admin-tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, ProjectMember])],
  controllers: [AdminTasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}