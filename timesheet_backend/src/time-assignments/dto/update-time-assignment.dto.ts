import { IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator'

export class UpdateTimeAssignmentDto {
  @IsUUID()
  @IsOptional()
  userId?: string

  @IsDateString()
  @IsOptional()
  weekStart?: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  hours?: number
}
