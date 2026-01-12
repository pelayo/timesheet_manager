import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { User } from './entities/user.entity'
import { AdminUserController } from './admin-user.controller'
import { CurrentUserService } from '../common/current-user.service'
import { UserImportService } from './user-import.service'

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, CurrentUserService, UserImportService],
  exports: [UserService, UserImportService],
  controllers: [UserController, AdminUserController],
})
export class UserModule {}
