import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { UserPinnedTask } from './entities/user-pinned-task.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { TimeEntriesService } from './time-entries.service';
import { UserTimeEntriesController } from './user-time-entries.controller';
import { AdminTimeEntriesController } from './admin-time-entries.controller';
import { TimesheetController } from './timesheet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, UserPinnedTask, Task, ProjectMember])],
  controllers: [UserTimeEntriesController, AdminTimeEntriesController, TimesheetController],
  providers: [TimeEntriesService],
  exports: [TimeEntriesService],
})
export class TimeEntriesModule {}