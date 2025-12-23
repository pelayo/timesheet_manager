import { Expose } from 'class-transformer';
import { TaskStatus } from '../entities/task.entity';

export class TaskResponseDto {
  @Expose()
  id: string;

  @Expose()
  projectId: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  status: TaskStatus;

  @Expose()
  closedAt: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
