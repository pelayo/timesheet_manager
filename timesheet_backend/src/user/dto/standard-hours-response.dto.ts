import { Expose } from 'class-transformer'

export class StandardHoursResponseDto {
  @Expose()
  userId: string

  @Expose()
  hours: number | null
}
