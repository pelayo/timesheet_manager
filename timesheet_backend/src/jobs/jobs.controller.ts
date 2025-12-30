import { Controller, Get, Post, Param, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PgBoss } from '@nestjs-enhanced/pg-boss';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly boss: PgBoss
  ) {}

  @Get()
  async getJobs() {
    // List recent jobs from the 'job' table (default pg-boss table)
    // We assume the table is in the public schema or search path.
    // If pg-boss creates its own schema, we might need 'pgboss.job'
    // Default is public.job
    try {
        const jobs = await this.dataSource.query(
            `SELECT id, name, data, state, createdon, startedon, completedon, retrycount, output FROM pgboss.job WHERE name NOT LIKE '__pgboss__%' ORDER BY createdon DESC LIMIT 50`
        );
        return jobs;
    } catch (e) {
        // Table might not exist yet if no jobs ran
        return [];
    }
  }

  @Post(':id/retry')
  async retryJob(@Param('id') id: string) {
      const jobs = await this.dataSource.query(
          `SELECT * FROM pgboss.job WHERE id = $1`, [id]
      );
      if (jobs.length === 0) return { error: 'Job not found' };
      const job = jobs[0];
      
      // Resubmit the job
      const jobId = await this.boss.send(job.name, job.data);
      return { id: jobId, message: 'Job retried' };
  }
}
