import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { plainToInstance } from 'class-transformer'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { Role } from '../user/entities/role.enum'
import { UserProfilesService } from './user-profiles.service'
import { CreateUserProfileDto } from './dto/create-user-profile.dto'
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'
import { UserProfileResponseDto } from './dto/user-profile-response.dto'

const parseActive = (value?: string) => {
  if (value === undefined) {
    return undefined
  }
  return value === 'true'
}

@Controller('admin/user-profiles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin)
export class AdminUserProfilesController {
  constructor(private readonly userProfilesService: UserProfilesService) {}

  @Get()
  async list(@Query('active') active?: string): Promise<UserProfileResponseDto[]> {
    const profiles = await this.userProfilesService.list(parseActive(active))
    return profiles.map((profile) =>
      plainToInstance(UserProfileResponseDto, profile, { excludeExtraneousValues: true }),
    )
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<UserProfileResponseDto> {
    const profile = await this.userProfilesService.getById(id)
    return plainToInstance(UserProfileResponseDto, profile, { excludeExtraneousValues: true })
  }

  @Post()
  async create(@Body() dto: CreateUserProfileDto): Promise<UserProfileResponseDto> {
    const profile = await this.userProfilesService.create(dto)
    return plainToInstance(UserProfileResponseDto, profile, { excludeExtraneousValues: true })
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    const profile = await this.userProfilesService.update(id, dto)
    return plainToInstance(UserProfileResponseDto, profile, { excludeExtraneousValues: true })
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.userProfilesService.delete(id)
  }
}
