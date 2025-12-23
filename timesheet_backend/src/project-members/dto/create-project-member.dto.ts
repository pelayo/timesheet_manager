import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ProjectRole } from '../entities/project-member.entity';

export class CreateProjectMemberDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}
