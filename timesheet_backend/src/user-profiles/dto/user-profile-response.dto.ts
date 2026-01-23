import { Expose } from 'class-transformer'

export class UserProfileResponseDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  discipline: string

  @Expose()
  level: string

  @Expose()
  costPerHour: number

  @Expose()
  active: boolean

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
