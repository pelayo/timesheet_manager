import { Type } from 'class-transformer'
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  discipline?: string

  @IsOptional()
  @IsString()
  level?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPerHour?: number

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
