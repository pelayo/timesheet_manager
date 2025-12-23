import { IsDateString, IsInt, IsNotEmpty, IsUUID, Max, Min } from 'class-validator';

export class UpdateTimesheetCellDto {
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsDateString()
  @IsNotEmpty()
  workDate: string;

  @IsInt()
  @Min(0)
  @Max(1440)
  minutes: number;
}
