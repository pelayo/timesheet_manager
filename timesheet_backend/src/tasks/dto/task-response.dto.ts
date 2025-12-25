import { Expose, Type } from 'class-transformer';
import { TaskStatus } from '../entities/task.entity';
import { ProjectResponseDto } from '../../projects/dto/project-response.dto';

export class TaskResponseDto {
  @Expose()
  id: string;

  @Expose()
  projectId: string;

  @Expose()
  @Type(() => ProjectResponseDto)
  project: ProjectResponseDto;

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
