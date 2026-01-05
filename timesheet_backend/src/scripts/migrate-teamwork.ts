import 'dotenv/config'
import { Queue } from 'bullmq'

async function bootstrap() {
  const host = process.env.REDIS_HOST || 'localhost'
  const port = Number(process.env.REDIS_PORT || 6379)
  const username = process.env.REDIS_USERNAME
  const password = process.env.REDIS_PASSWORD
  const db = Number(process.env.REDIS_DB || 0)

  const queue = new Queue('teamwork-import', {
    connection: {
      host,
      port,
      username,
      password,
      db,
    },
  })

  try {
    const domain = process.env.TEAMWORK_DOMAIN
    const apiKey = process.env.TEAMWORK_API_KEY

    console.log(`🚀 Queueing Teamwork Migration Job...`)
    const job = await queue.add('teamwork-import', { domain, apiKey })
    console.log(`✅ Job enqueued with ID: ${job.id}`)
  } catch (err) {
    console.error('Failed to enqueue job:', err)
  } finally {
    try {
      await queue.close()
    } catch (err) {
      console.error('Failed to close Redis connection:', err)
    }
    process.exit(0)
  }
}

bootstrap()
