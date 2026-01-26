import { Expose } from 'class-transformer'

export class TimeAssignmentTeamworkCumulativeDto {
  @Expose()
  userId: string

  @Expose()
  userEmail: string

  @Expose()
  projectId: string

  @Expose()
  projectName: string

  @Expose()
  hours: number
}
