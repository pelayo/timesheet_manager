import { IsNumber, Min } from 'class-validator'

export class UpdateStandardHoursDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hours: number
}
