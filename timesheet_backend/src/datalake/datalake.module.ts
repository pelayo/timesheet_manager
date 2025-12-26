import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatalakeService } from './datalake.service';
import { DatalakeEntry } from './entities/datalake-entry.entity';
import { TimeEntry } from '../time-entries/entities/time-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DatalakeEntry, TimeEntry])],
  providers: [DatalakeService],
  exports: [DatalakeService, TypeOrmModule], // Export TypeOrmModule so other modules can use repository
})
export class DatalakeModule {}
