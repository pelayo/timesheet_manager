import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Profile } from './entities/profile.entity'
import { ProfilesService } from './profiles.service'
import { AdminProfilesController } from './admin-profiles.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  providers: [ProfilesService],
  exports: [ProfilesService],
  controllers: [AdminProfilesController],
})
export class ProfilesModule {}
