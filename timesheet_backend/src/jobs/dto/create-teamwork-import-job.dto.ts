import { IsDateString, IsOptional } from 'class-validator'

export class CreateTeamworkImportJobDto {
  @IsOptional()
  @IsDateString()
  since?: string
}
