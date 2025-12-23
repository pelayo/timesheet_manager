import { Expose } from 'class-transformer'
import { Role } from '../entities/role.enum'

export class MeUserDto {
  @Expose()
  id: string

  @Expose()
  email: string

  @Expose()
  role: Role
}
