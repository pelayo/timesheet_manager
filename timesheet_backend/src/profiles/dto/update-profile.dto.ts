import { Type } from 'class-transformer'
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  discipline?: string

  @IsString()
  @IsOptional()
  level?: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  costPerHour?: number

  @IsBoolean()
  @IsOptional()
  active?: boolean
}
