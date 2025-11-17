import { Injectable } from '@nestjs/common'
import { User } from './entities/user.entity'

@Injectable()
export class UserService {
  // In a real application, you would fetch users from a database.
  private readonly users: User[] = [
    {
      id: 1,
      email: 'test@example.com',
      password: 'password', // In a real app, this should be hashed!
    },
  ]

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email)
  }
}
