import { Controller, Get, Param, Post } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import type { Queue } from 'bullmq'

@Controller('jobs')
export class JobsController {
  constructor(
    @InjectQueue('teamwork-import') private readonly teamworkQueue: Queue,
  ) {}

  @Get()
  async getJobs() {
    try {
      const jobs = await this.teamworkQueue.getJobs(
        ['waiting', 'active', 'delayed', 'failed', 'completed'],
        0,
        49,
        true,
      )

      return await Promise.all(
        jobs.map(async job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          state: await job.getState(),
          createdAt: job.timestamp,
          processedAt: job.processedOn ?? null,
          completedAt: job.finishedOn ?? null,
          attemptsMade: job.attemptsMade,
          returnValue: job.returnvalue ?? null,
          failedReason: job.failedReason ?? null,
        })),
      )
    } catch (e) {
      // Queue may not be initialized yet
      return []
    }
  }

  @Post(':id/retry')
  async retryJob(@Param('id') id: string) {
    const job = await this.teamworkQueue.getJob(id)
    if (!job) return { error: 'Job not found' }

    const newJob = await this.teamworkQueue.add(job.name, job.data)
    return { id: newJob.id, message: 'Job retried' }
  }
}
