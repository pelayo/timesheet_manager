import { Expose, Transform } from 'class-transformer'
import { Role } from '../entities/role.enum'

export class UserResponseDto {
  @Expose()
  id: string

  @Expose()
  email: string

  @Expose()
  role: Role

  @Expose()
  @Transform(({ obj }) => (obj.standardHours ? Number(obj.standardHours.weeklyHours) : null))
  standardHours: number | null

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
