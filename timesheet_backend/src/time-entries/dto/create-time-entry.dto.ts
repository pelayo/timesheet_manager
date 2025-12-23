import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateTimeEntryDto {
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsDateString()
  @IsNotEmpty()
  workDate: string;

  @IsInt()
  @Min(1)
  @Max(1440)
  minutes: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
