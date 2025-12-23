import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { TasksService } from './tasks.service';
import { AdminTasksController } from './admin-tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, ProjectMember])],
  controllers: [AdminTasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}