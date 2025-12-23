import { Expose } from 'class-transformer';

export class TimesheetRowDto {
  @Expose()
  projectId: string;
  
  @Expose()
  projectName: string;
  
  @Expose()
  taskId: string;
  
  @Expose()
  taskName: string;
  
  @Expose()
  isClosed: boolean;
  
  @Expose()
  minutesByDay: Record<string, number>;
}

export class TimesheetViewDto {
  @Expose()
  weekStart: string;
  
  @Expose()
  days: string[];
  
  @Expose()
  rows: TimesheetRowDto[];
  
  @Expose()
  totalsByDay: Record<string, number>;
  
  @Expose()
  totalWeek: number;
}
