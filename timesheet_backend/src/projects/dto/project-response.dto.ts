import { Expose } from 'class-transformer';

export class ProjectResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  description: string;

  @Expose()
  isArchived: boolean;

  @Expose()
  isGlobal: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
