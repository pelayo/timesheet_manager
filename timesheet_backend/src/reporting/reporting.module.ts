import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ReportingController } from './reporting.controller';
import { UserReportingController } from './user-reporting.controller';
import { ReportingService } from './reporting.service';
import { TimeEntry } from '../time-entries/entities/time-entry.entity';
import { DatalakeModule } from '../datalake/datalake.module';
import { StandardHours } from '../user/entities/standard-hours.entity';
import { ProjectMembersModule } from '../project-members/project-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeEntry, StandardHours]),
    CacheModule.register(),
    DatalakeModule,
    ProjectMembersModule,
  ],
  controllers: [ReportingController, UserReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
