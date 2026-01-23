import { Type } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  discipline: string

  @IsString()
  @IsNotEmpty()
  level: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPerHour: number

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
