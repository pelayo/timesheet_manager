import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../../app.module'
import { DatalakeService } from '../datalake.service'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const datalakeService = app.get(DatalakeService)

  try {
    await datalakeService.rebuild()
  } catch (error) {
    console.error('Datalake rebuild failed:', error)
    process.exit(1)
  }

  await app.close()
}

bootstrap()
