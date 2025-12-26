import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { TimeEntry } from '../time-entries/entities/time-entry.entity';
import { DatalakeModule } from '../datalake/datalake.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeEntry]),
    CacheModule.register(),
    DatalakeModule,
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
