import { Type } from 'class-transformer'
import { IsBoolean, IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator'

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  teamworkId?: string;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean;

  @IsBoolean()
  @IsOptional()
  isChargeable?: boolean;

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
