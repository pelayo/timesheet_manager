import { ClassSerializerInterceptor, Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { AuthGuard } from '@nestjs/passport'
import { MeUserDto } from './dto/me-user.dto'
import { User } from './entities/user.entity'
import { GetUser } from '../auth/decorators/get-user.decorator'

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@GetUser() user: User): MeUserDto {
    return plainToInstance(
      MeUserDto,
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      { excludeExtraneousValues: true },
    )
  }
}
