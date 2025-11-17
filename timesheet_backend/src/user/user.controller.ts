import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { MeUserDto } from './dto/me-user.dto'
import { User } from './entities/user.entity'
import { GetUser } from '../auth/decorators/get-user.decorator'

@Controller('user')
export class UserController {
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@GetUser() user: User): MeUserDto {
    // The user object is attached to the request by the JwtStrategy
    // The GetUser decorator extracts it for convenience.
    return {
      id: user.id,
      email: user.email,
    }
  }
}
