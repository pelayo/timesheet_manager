import { Expose, Type } from 'class-transformer';
import { ProjectRole } from '../entities/project-member.entity';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class ProjectMemberResponseDto {
  @Expose()
  projectId: string;

  @Expose()
  userId: string;

  @Expose()
  role: ProjectRole;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  createdAt: Date;
}
