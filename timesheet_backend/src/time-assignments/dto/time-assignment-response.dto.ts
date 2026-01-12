import { Expose, Type } from 'class-transformer'
import { UserResponseDto } from '../../user/dto/user-response.dto'

export class TimeAssignmentResponseDto {
  @Expose()
  id: string

  @Expose()
  projectId: string

  @Expose()
  userId: string

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto

  @Expose()
  startDate: string

  @Expose()
  endDate: string

  @Expose()
  hours: number

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
