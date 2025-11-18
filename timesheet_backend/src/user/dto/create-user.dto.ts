import { Type } from 'class-transformer'
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { Role } from '../entities/role.enum'

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string

  @IsEnum(Role)
  @Type(() => String)
  role: Role
}
