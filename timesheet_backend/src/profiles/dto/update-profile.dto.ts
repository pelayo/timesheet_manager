import { Type } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  discipline?: string

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  level?: string

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  costPerHour?: number

  @IsBoolean()
  @IsOptional()
  active?: boolean
}
