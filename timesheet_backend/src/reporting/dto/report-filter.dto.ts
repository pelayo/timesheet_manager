import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ReportFilterDto {
  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsOptional()
  groupBy?: string;
}
