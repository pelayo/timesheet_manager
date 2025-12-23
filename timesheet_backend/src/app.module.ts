import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { ConfigModule } from './config/config.module'
import { ConfigService } from './config/config.service'
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectMembersModule } from './project-members/project-members.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...config.getDatabaseConfig(),
        autoLoadEntities: true,
      }),
    }),
    AuthModule,
    UserModule,
    ProjectsModule,
    TasksModule,
    ProjectMembersModule,
    TimeEntriesModule,
    ReportingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
