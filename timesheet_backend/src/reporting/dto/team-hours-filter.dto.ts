import { IsOptional, IsString, IsUUID } from 'class-validator';

export class TeamHoursFilterDto {
  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsUUID()
  @IsOptional()
  leadId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  thresholdHours?: string;
}
