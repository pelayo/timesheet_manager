import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../user/user.service'
import { User } from '../user/entities/user.entity'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userService.findOneByEmailWithPassword(email)

    if (user && user.password === pass) {
      const { password, ...safeUser } = user
      return safeUser as User
    }
    return null
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
