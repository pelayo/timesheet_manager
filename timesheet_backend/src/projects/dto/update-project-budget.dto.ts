import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator'

export class UpdateProjectBudgetDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  budgetAmount?: number

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  @IsOptional()
  budgetCurrency?: string
}
