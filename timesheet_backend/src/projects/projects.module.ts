import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { ProjectsService } from './projects.service';
import { AdminProjectsController } from './admin-projects.controller';
import { UserProjectsController } from './user-projects.controller';
import { CurrentUserService } from '../common/current-user.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember]), TasksModule],
  controllers: [AdminProjectsController, UserProjectsController],
  providers: [ProjectsService, CurrentUserService],
  exports: [ProjectsService],
})
export class ProjectsModule {}