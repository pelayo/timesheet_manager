import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { DatalakeEntry } from './entities/datalake-entry.entity';
import { TimeEntry } from '../time-entries/entities/time-entry.entity';

@Injectable()
export class DatalakeService {
  constructor(
    @InjectRepository(DatalakeEntry)
    private readonly datalakeRepository: Repository<DatalakeEntry>,
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
  ) {}

  @OnEvent('time-entry.created')
  @OnEvent('time-entry.updated')
  async handleTimeEntryChange(payload: TimeEntry) {
    // Fetch full details to ensure we have project info
    const entry = await this.timeEntryRepository.findOne({
      where: { id: payload.id },
      relations: ['task', 'task.project'],
    });

    if (!entry) {
      // Might be deleted? If updated/created it should exist.
      return;
    }

    await this.upsertDatalakeEntry(entry);
  }

  @OnEvent('time-entry.deleted')
  async handleTimeEntryDeleted(payload: TimeEntry) {
    await this.datalakeRepository.delete(payload.id);
  }

  async rebuild() {
    console.log('Clearing datalake...');
    await this.datalakeRepository.clear();
    
    console.log('Rebuilding datalake...');
    const batchSize = 1000;
    let page = 0;
    let hasMore = true;
    let count = 0;

    while (hasMore) {
        const entries = await this.timeEntryRepository.find({
            relations: ['task', 'task.project'],
            take: batchSize,
            skip: page * batchSize,
        });

        if (entries.length === 0) {
            hasMore = false;
            break;
        }

        for (const entry of entries) {
            await this.upsertDatalakeEntry(entry);
            count++;
        }
        console.log(`Processed ${count} entries...`);
        page++;
    }
    console.log('Datalake rebuild complete.');
  }

  private async upsertDatalakeEntry(entry: TimeEntry) {
    const date = new Date(entry.workDate);
    
    // Helpers for date parts
    const year = date.getFullYear().toString();
    const month = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const week = this.getISOWeek(date);

    const datalakeEntry = new DatalakeEntry();
    datalakeEntry.id = entry.id;
    datalakeEntry.userId = entry.userId;
    datalakeEntry.projectId = entry.task.projectId;
    datalakeEntry.taskId = entry.taskId;
    datalakeEntry.date = entry.workDate; // Assuming string YYYY-MM-DD or Date object handled by TypeORM
    datalakeEntry.week = week;
    datalakeEntry.month = month;
    datalakeEntry.year = year;
    datalakeEntry.minutes = entry.minutes;

    await this.datalakeRepository.save(datalakeEntry);
  }

  private getISOWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-${weekNo.toString().padStart(2, '0')}`;
  }
}
