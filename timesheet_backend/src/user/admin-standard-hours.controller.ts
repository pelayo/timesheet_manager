import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { plainToInstance } from 'class-transformer'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { Role } from './entities/role.enum'
import { StandardHoursService } from './standard-hours.service'
import { UpdateStandardHoursDto } from './dto/update-standard-hours.dto'
import { StandardHoursResponseDto } from './dto/standard-hours-response.dto'

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin)
export class AdminStandardHoursController {
  constructor(private readonly standardHoursService: StandardHoursService) {}

  @Get(':id/standard-hours')
  async getForUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StandardHoursResponseDto> {
    const standardHours = await this.standardHoursService.getByUserId(id)
    if (!standardHours) {
      return plainToInstance(
        StandardHoursResponseDto,
        { userId: id, hours: null },
        { excludeExtraneousValues: true },
      )
    }
    return plainToInstance(StandardHoursResponseDto, standardHours, { excludeExtraneousValues: true })
  }

  @Put(':id/standard-hours')
  async upsertForUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStandardHoursDto,
  ): Promise<StandardHoursResponseDto> {
    const standardHours = await this.standardHoursService.upsertForUser(id, dto.hours)
    return plainToInstance(StandardHoursResponseDto, standardHours, { excludeExtraneousValues: true })
  }
}
