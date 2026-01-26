import { IsEnum, IsOptional, IsString } from 'class-validator'

export enum LeadTimeGrouping {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class LeadTeamHoursFilterDto {
  @IsString()
  @IsOptional()
  from?: string

  @IsString()
  @IsOptional()
  to?: string

  @IsEnum(LeadTimeGrouping)
  @IsOptional()
  groupBy?: LeadTimeGrouping = LeadTimeGrouping.WEEK
}
