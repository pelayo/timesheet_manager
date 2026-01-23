import { Expose } from 'class-transformer'

export class TimeAssignmentWeeklySummaryDto {
  @Expose()
  userId: string

  @Expose()
  userEmail: string

  @Expose()
  projectId: string

  @Expose()
  projectName: string

  @Expose()
  weekStart: string

  @Expose()
  hours: number
}
