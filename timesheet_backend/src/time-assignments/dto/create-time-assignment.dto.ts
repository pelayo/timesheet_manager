import { IsDateString, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator'

export class CreateTimeAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string

  @IsDateString()
  @IsNotEmpty()
  weekStart: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  hours: number
}
