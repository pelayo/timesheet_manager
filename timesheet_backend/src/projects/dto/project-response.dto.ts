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
  budgetAmount: number;

  @Expose()
  currency: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
