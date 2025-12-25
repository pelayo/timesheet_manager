import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { TimeEntry } from '../time-entries/entities/time-entry.entity';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeEntry]),
    CacheModule.register(),
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
