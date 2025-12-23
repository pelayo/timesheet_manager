import { Expose } from 'class-transformer'
import { Role } from '../entities/role.enum'

export class UserResponseDto {
  @Expose()
  id: string

  @Expose()
  email: string

  @Expose()
  role: Role

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
