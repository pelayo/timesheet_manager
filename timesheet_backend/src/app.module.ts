import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { LoggerModule } from 'nestjs-pino'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { ConfigModule } from './config/config.module'
import { ConfigService } from './config/config.service'
import { ProjectsModule } from './projects/projects.module'
import { TasksModule } from './tasks/tasks.module'
import { ProjectMembersModule } from './project-members/project-members.module'
import { TimeEntriesModule } from './time-entries/time-entries.module'
import { ReportingModule } from './reporting/reporting.module'
import { DatalakeModule } from './datalake/datalake.module'
import { JobsModule } from './jobs/jobs.module'
import { TimeAssignmentsModule } from './time-assignments/time-assignments.module'
import { ProfilesModule } from './profiles/profiles.module'

const isProduction = process.env.NODE_ENV === 'production'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        ...(isProduction
          ? {}
          : {
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                },
              },
            }),
      },
    }),
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...config.getDatabaseConfig(),
        autoLoadEntities: true,
      }),
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    UserModule,
    ProfilesModule,
    ProjectsModule,
    TasksModule,
    ProjectMembersModule,
    TimeEntriesModule,
    TimeAssignmentsModule,
    ReportingModule,
    DatalakeModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
