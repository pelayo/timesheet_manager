import { Module } from '@nestjs/common';
import { QueueModule } from '@nestjs-enhanced/pg-boss';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { TeamworkImportJob } from './teamwork-import.job';
import { JobsController } from './jobs.controller';
import { UserModule } from '../user/user.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectMembersModule } from '../project-members/project-members.module';
import { TimeEntriesModule } from '../time-entries/time-entries.module';

@Module({
  imports: [
    QueueModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbConfig = config.getDatabaseConfig() as any;
        // Construct connection string for postgres
        // postgres://user:password@host:port/database
        const connectionString = `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
        return {
          application_name: 'timesheet-backend',
          connectionString,
        };
      },
    }),
    UserModule,
    ProjectsModule,
    TasksModule,
    ProjectMembersModule,
    TimeEntriesModule,
    ConfigModule,
  ],
  providers: [TeamworkImportJob],
  controllers: [JobsController],
  exports: [QueueModule],
})
export class JobsModule {}
