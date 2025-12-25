import { Expose, Type } from 'class-transformer';
import { TimeEntryResponseDto } from './time-entry-response.dto';

export class TimeEntryListResponseDto {
  @Expose()
  @Type(() => TimeEntryResponseDto)
  data: TimeEntryResponseDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;
}
