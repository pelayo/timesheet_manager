import { Injectable } from '@nestjs/common'
import { DataSourceOptions } from 'typeorm'
import { User } from '../user/entities/user.entity'

@Injectable()
export class ConfigService {
  private readonly env: Record<string, string | undefined>

  constructor() {
    this.env = process.env
  }

  getString(key: string, defaultValue?: string): string {
    const value = this.env[key] ?? defaultValue
    if (value === undefined) {
      throw new Error(`Missing environment variable: ${key}`)
    }
    return value
  }

  getNumber(key: string, defaultValue?: number): number {
    const raw = this.env[key]
    if (raw === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Missing environment variable: ${key}`)
      }
      return defaultValue
    }
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a number`)
    }
    return parsed
  }

  isTest(): boolean {
    return (this.env.NODE_ENV ?? '').toLowerCase() === 'test'
  }

  getJwtSecret(): string {
    return this.getString('JWT_SECRET')
  }

  getDatabaseConfig(): DataSourceOptions {
    const isPostgres = (this.env.DB_TYPE ?? '').toLowerCase() === 'postgres'
    const isTest = this.isTest()

    if (isPostgres) {
      return {
        type: 'postgres',
        host: this.getString('DB_HOST', 'localhost'),
        port: this.getNumber('DB_PORT', 5432),
        username: this.getString('DB_USERNAME', 'postgres'),
        password: this.getString('DB_PASSWORD', 'postgres'),
        database: this.getString('DB_NAME', 'timesheet'),
        synchronize: this.env.DB_SYNCHRONIZE !== 'false',
        entities: [User],
      }
    }

    return {
      type: 'sqlite',
      database: isTest ? ':memory:' : this.getString('DB_DATABASE', 'timesheet.sqlite'),
      synchronize: this.env.DB_SYNCHRONIZE !== 'false',
      dropSchema: isTest,
      entities: [User],
    }
  }
}
