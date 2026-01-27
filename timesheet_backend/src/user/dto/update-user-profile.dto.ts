import { IsOptional, IsUUID } from 'class-validator'

export class UpdateUserProfileDto {
  @IsUUID()
  @IsOptional()
  profileId?: string | null
}
