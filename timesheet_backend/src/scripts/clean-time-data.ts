import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../app.module'
import { TimeEntry } from '../time-entries/entities/time-entry.entity'
import { TimeAssignment } from '../time-assignments/entities/time-assignment.entity'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const dataSource = app.get(DataSource)

  const timeEntryRepo = dataSource.getRepository(TimeEntry)
  const timeAssignmentRepo = dataSource.getRepository(TimeAssignment)

  const entryCount = await timeEntryRepo.count()
  const assignmentCount = await timeAssignmentRepo.count()

  await timeEntryRepo.createQueryBuilder().delete().execute()
  await timeAssignmentRepo.createQueryBuilder().delete().execute()

  console.log(
    `Deleted ${entryCount} time entries and ${assignmentCount} time assignments`,
  )

  await app.close()
}

bootstrap().catch((error) => {
  console.error('Failed to clean time data', error)
  process.exit(1)
})
