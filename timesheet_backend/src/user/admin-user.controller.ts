import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { plainToInstance } from 'class-transformer'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserResponseDto } from './dto/user-response.dto'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { Role } from './entities/role.enum'

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.SuperAdmin, Role.Admin)
  async list(): Promise<UserResponseDto[]> {
    const users = await this.userService.listManagedUsers()
    return users.map((user) =>
      plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    )
  }

  @Get(':id')
  @Roles(Role.SuperAdmin, Role.Admin)
  async getById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.userService.getManagedUser(id)
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true })
  }

  @Post()
  @Roles(Role.SuperAdmin, Role.Admin)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.createUser(dto)
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true })
  }

  @Patch(':id')
  @Roles(Role.SuperAdmin, Role.Admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(id, dto)
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true })
  }

  @Delete(':id')
  @Roles(Role.SuperAdmin, Role.Admin)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userService.deleteUser(id)
  }
}
