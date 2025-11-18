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
import { GetUser } from '../auth/decorators/get-user.decorator'
import { User } from './entities/user.entity'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserResponseDto } from './dto/user-response.dto'

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async list(@GetUser() actor: User): Promise<UserResponseDto[]> {
    const users = await this.userService.listManagedUsers(actor)
    return users.map((user) =>
      plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    )
  }

  @Get(':id')
  async getById(
    @GetUser() actor: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.userService.getManagedUser(actor, id)
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true })
  }

  @Post()
  async create(
    @GetUser() actor: User,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.createUser(actor, dto)
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true })
  }

  @Patch(':id')
  async update(
    @GetUser() actor: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(actor, id, dto)
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true })
  }

  @Delete(':id')
  async delete(@GetUser() actor: User, @Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userService.deleteUser(actor, id)
  }
}
