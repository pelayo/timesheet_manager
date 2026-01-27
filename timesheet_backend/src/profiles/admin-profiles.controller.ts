import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { plainToInstance } from 'class-transformer'
import { ProfilesService } from './profiles.service'
import { CreateProfileDto } from './dto/create-profile.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ProfileResponseDto } from './dto/profile-response.dto'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { Role } from '../user/entities/role.enum'

@Controller('admin/profiles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin)
export class AdminProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  async findAll(): Promise<ProfileResponseDto[]> {
    const profiles = await this.profilesService.findAll()
    return profiles.map((profile) =>
      plainToInstance(ProfileResponseDto, profile, { excludeExtraneousValues: true }),
    )
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.findOne(id)
    return plainToInstance(ProfileResponseDto, profile, { excludeExtraneousValues: true })
  }

  @Post()
  async create(@Body() dto: CreateProfileDto): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.create(dto)
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

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.profilesService.remove(id)
  }
}
