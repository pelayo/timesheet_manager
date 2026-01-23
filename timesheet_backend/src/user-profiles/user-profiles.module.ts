import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserProfile } from './entities/user-profile.entity'
import { UserProfilesService } from './user-profiles.service'
import { AdminUserProfilesController } from './admin-user-profiles.controller'

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile])],
  controllers: [AdminUserProfilesController],
  providers: [UserProfilesService],
  exports: [UserProfilesService],
})
export class UserProfilesModule {}
