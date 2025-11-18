import { Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { User } from '../user/entities/user.entity'

@Injectable({ scope: Scope.REQUEST })
export class CurrentUserService {
  constructor(
    @Inject(REQUEST)
    private readonly request: { user?: User } | undefined,
  ) {}

  get(): User {
    if (!this.request?.user) {
      throw new UnauthorizedException('User not authenticated')
    }

    return this.request.user
  }
}
