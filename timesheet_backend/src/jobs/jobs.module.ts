import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule } from '../config/config.module'
import { TeamworkImportJob } from './teamwork-import.job'
import { JobsController } from './jobs.controller'
import { UserModule } from '../user/user.module'
import { ProjectsModule } from '../projects/projects.module'
import { TasksModule } from '../tasks/tasks.module'
import { ProjectMembersModule } from '../project-members/project-members.module'
import { TimeEntriesModule } from '../time-entries/time-entries.module'

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'redis',
          port: Number(process.env.REDIS_PORT ?? 6379),
          username: process.env.REDIS_USERNAME,
          password: process.env.REDIS_PASSWORD,
          db: Number(process.env.REDIS_DB ?? 0),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'teamwork-import' }),
    UserModule,
    ProjectsModule,
    TasksModule,
    ProjectMembersModule,
    TimeEntriesModule,
  ],
  providers: [TeamworkImportJob],
  controllers: [JobsController],
  exports: [BullModule],
})
export class JobsModule {}
