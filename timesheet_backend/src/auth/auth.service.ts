import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../user/user.service'
import { User } from '../user/entities/user.entity'
import { compare } from 'bcryptjs'

const isBcryptHash = (value: string) => value.startsWith('$2')

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userService.findOneByEmailWithPassword(email)

    if (!user) {
      return null
    }

    if (isBcryptHash(user.password)) {
      const matches = await compare(pass, user.password)
      if (!matches) return null
    } else {
      if (user.password !== pass) return null
      await this.userService.setPasswordHash(user.id, pass)
    }

    const { password, ...safeUser } = user
    return safeUser as User
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
