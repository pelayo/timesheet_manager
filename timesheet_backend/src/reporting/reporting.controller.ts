import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ReportingService } from './reporting.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../user/entities/role.enum';

@Controller('admin/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('time-entries')
  async getReport(@Query() filter: ReportFilterDto) {
    return this.reportingService.getReport(filter);
  }

  @Get('time-entries/export')
  async exportCsv(@Query() filter: ReportFilterDto, @Res() res: express.Response) {
    const csv = await this.reportingService.exportCsv(filter);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="time-entries.csv"',
    });
    res.send(csv);
  }
}