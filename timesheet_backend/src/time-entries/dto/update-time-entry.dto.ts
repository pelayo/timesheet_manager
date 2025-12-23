import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateTimeEntryDto {
  @IsInt()
  @Min(1)
  @Max(1440)
  @IsOptional()
  minutes?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
