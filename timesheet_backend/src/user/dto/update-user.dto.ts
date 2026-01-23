import { Type } from 'class-transformer'
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator'
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

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(168)
  @Type(() => Number)
  standardHours?: number
}
