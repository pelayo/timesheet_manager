import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSourceOptions } from 'typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { User } from './user/entities/user.entity'

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

function getDatabaseConfig(): DataSourceOptions {
  const isPostgres = (process.env.DB_TYPE ?? '').toLowerCase() === 'postgres'

  if (isPostgres) {
    return {
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'timesheet',
      synchronize: process.env.DB_SYNCHRONIZE !== 'false',
      entities: [User],
    }
  }

  return {
    type: 'sqlite',
    database: process.env.DB_DATABASE ?? 'timesheet.sqlite',
    synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    entities: [User],
  }
}
