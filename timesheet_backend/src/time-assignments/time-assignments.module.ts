import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TimeAssignmentsService } from './time-assignments.service'
import { TimeAssignment } from './entities/time-assignment.entity'
import { AdminTimeAssignmentsController } from './admin-time-assignments.controller'
import { ProjectMembersModule } from '../project-members/project-members.module'

@Module({
  imports: [TypeOrmModule.forFeature([TimeAssignment]), ProjectMembersModule],
  controllers: [AdminTimeAssignmentsController],
  providers: [TimeAssignmentsService],
})
export class TimeAssignmentsModule {}
