import { Expose, Type } from 'class-transformer';
import { TaskResponseDto } from '../../tasks/dto/task-response.dto';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class TimeEntryResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  taskId: string;

  @Expose()
  @Type(() => TaskResponseDto)
  task: TaskResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  workDate: string;

  @Expose()
  minutes: number;

  @Expose()
  notes: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
