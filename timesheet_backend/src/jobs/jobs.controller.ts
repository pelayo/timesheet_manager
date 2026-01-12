import { BadRequestException, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import type { Queue } from 'bullmq'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import * as path from 'path'
import * as fs from 'fs'

@Controller('jobs')
export class JobsController {
  constructor(
    @InjectQueue('teamwork-import') private readonly teamworkQueue: Queue,
    @InjectQueue('teamwork-excel-import') private readonly teamworkExcelQueue: Queue,
  ) {}

  @Get()
  async getJobs() {
    const queues = [
      { name: 'teamwork-import', queue: this.teamworkQueue },
      { name: 'teamwork-excel-import', queue: this.teamworkExcelQueue },
    ]

    const results = await Promise.all(
      queues.map(async ({ name, queue }) => {
        try {
          const jobs = await queue.getJobs(
            ['waiting', 'active', 'delayed', 'failed', 'completed'],
            0,
            49,
            true,
          )

          return await Promise.all(
            jobs.map(async job => ({
              id: String(job.id),
              name: job.name,
              queue: name,
              data: job.data,
              state: await job.getState(),
              createdAt: job.timestamp,
              createdon: job.timestamp,
              processedAt: job.processedOn ?? null,
              startedon: job.processedOn ?? null,
              completedAt: job.finishedOn ?? null,
              completedon: job.finishedOn ?? null,
              attemptsMade: job.attemptsMade,
              retrycount: job.attemptsMade,
              returnValue: job.returnvalue ?? null,
              output: job.returnvalue ?? null,
              failedReason: job.failedReason ?? null,
            })),
          )
        } catch (e) {
          return []
        }
      }),
    )

    const merged = results.flat()
    return merged.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  }

  @Post(':id/retry')
  async retryJob(@Param('id') id: string) {
    const job = await this.teamworkQueue.getJob(id)
    if (job) {
      const newJob = await this.teamworkQueue.add(job.name, job.data)
      return { id: newJob.id, message: 'Job retried' }
    }

    const excelJob = await this.teamworkExcelQueue.getJob(id)
    if (excelJob) {
      const newJob = await this.teamworkExcelQueue.add(excelJob.name, excelJob.data)
      return { id: newJob.id, message: 'Job retried' }
    }

    return { error: 'Job not found' }
  }

  @Post('teamwork-excel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = path.resolve(process.cwd(), 'data', 'uploads', 'teamwork')
          fs.mkdirSync(uploadDir, { recursive: true })
          cb(null, uploadDir)
        },
        filename: (_req, file, cb) => {
          const timestamp = Date.now()
          const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
          cb(null, `${timestamp}-${safeName}`)
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
          return cb(new BadRequestException('Only .xlsx files are supported'), false)
        }
        return cb(null, true)
      },
    }),
  )
  async uploadTeamworkExcel(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    const job = await this.teamworkExcelQueue.add('teamwork-excel-import', {
      filePath: file.path,
      originalName: file.originalname,
    })

    return { id: job.id, message: 'Teamwork Excel import enqueued', filePath: file.path }
  }
}
