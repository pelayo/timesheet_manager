import { Type } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  discipline: string

  @IsString()
  @IsNotEmpty()
  level: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  costPerHour: number

  @IsBoolean()
  @IsOptional()
  active?: boolean
}
