import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { User } from './entities/user.entity'
import { StandardHours } from './entities/standard-hours.entity'
import { AdminUserController } from './admin-user.controller'
import { CurrentUserService } from '../common/current-user.service'
import { UserImportService } from './user-import.service'
import { StandardHoursService } from './standard-hours.service'
import { AdminStandardHoursController } from './admin-standard-hours.controller'
import { Profile } from '../profiles/entities/profile.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, StandardHours, Profile])],
  providers: [UserService, CurrentUserService, UserImportService, StandardHoursService],
  exports: [UserService, UserImportService],
  controllers: [UserController, AdminUserController, AdminStandardHoursController],
})
export class UserModule {}
