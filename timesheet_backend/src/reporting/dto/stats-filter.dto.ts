import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TimeGrouping {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  TOTAL = 'total' // No time grouping
}

export enum EntityGrouping {
  PROJECT = 'project',
  TASK = 'task',
  USER = 'user'
}

export class StatsFilterDto {
  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(TimeGrouping)
  @IsOptional()
  timeGrouping?: TimeGrouping = TimeGrouping.TOTAL;

  @IsArray()
  @IsEnum(EntityGrouping, { each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  groupBy?: EntityGrouping[] = [];
}
