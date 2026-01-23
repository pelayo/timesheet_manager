import { Body, ClassSerializerInterceptor, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { plainToInstance } from 'class-transformer'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { Role } from '../user/entities/role.enum'
import { CreateProfileDto } from './dto/create-profile.dto'
import { ProfileResponseDto } from './dto/profile-response.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ProfilesService } from './profiles.service'

@Controller('admin/profiles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin)
export class AdminProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  async create(@Body() dto: CreateProfileDto): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.create(dto)
    return plainToInstance(ProfileResponseDto, profile, { excludeExtraneousValues: true })
  }

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('active') active?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ items: ProfileResponseDto[]; total: number }> {
    const isActive = active === 'true' ? true : active === 'false' ? false : undefined
    const { items, total } = await this.profilesService.findAll(search, isActive, page, limit)
    return {
      items: items.map((profile) =>
        plainToInstance(ProfileResponseDto, profile, { excludeExtraneousValues: true }),
      ),
      total,
    }
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.findOne(id)
    return plainToInstance(ProfileResponseDto, profile, { excludeExtraneousValues: true })
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.update(id, dto)
    return plainToInstance(ProfileResponseDto, profile, { excludeExtraneousValues: true })
  }
}
