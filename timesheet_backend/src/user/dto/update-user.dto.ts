import { Type } from 'class-transformer'
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'
import { Role } from '../entities/role.enum'

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string

  @IsEnum(Role)
  @IsOptional()
  @Type(() => String)
  role?: Role

  @IsOptional()
  @IsUUID()
  profileId?: string | null
}
