import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

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

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  budgetAmount?: number;

  @IsString()
  @Matches(/^[A-Z]{3}$/)
  @IsOptional()
  currency?: string;
}
