import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectMembersService } from './project-members.service';
import { AdminProjectMembersController } from './admin-project-members.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectMember])],
  controllers: [AdminProjectMembersController],
  providers: [ProjectMembersService],
  exports: [TypeOrmModule, ProjectMembersService], // Export service just in case
})
export class ProjectMembersModule {}