import { Injectable, OnModuleInit } from '@nestjs/common'
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import type { Job } from 'bullmq'
import axios from 'axios'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { UserService } from '../user/user.service'
import { ProjectsService } from '../projects/projects.service'
import { TasksService } from '../tasks/tasks.service'
import { ProjectMembersService } from '../project-members/project-members.service'
import { TimeEntriesService } from '../time-entries/time-entries.service'
import { Role } from '../user/entities/role.enum'
import { ProjectRole } from '../project-members/entities/project-member.entity'
import { TaskStatus } from '../tasks/entities/task.entity'

const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

@Processor('teamwork-import')
@Injectable()
export class TeamworkImportJob extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly userService: UserService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly projectMembersService: ProjectMembersService,
    private readonly timeEntriesService: TimeEntriesService,
    @InjectPinoLogger(TeamworkImportJob.name)
    private readonly logger: PinoLogger,
  ) {
    super()
  }

  onModuleInit() {
    this.logger.info('Teamwork import worker ready')
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.info(`[Job ${job.id}] Worker started ${job.name}`)
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.info(`[Job ${job.id}] Worker completed ${job.name}`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    const jobId = job?.id ?? 'unknown'
    this.logger.error({ err: error }, `[Job ${jobId}] Worker failed`)
  }

  async process(job: Job<{ domain?: string; apiKey?: string }>) {
    this.logger.info(`Starting Teamwork Import Job ${job.id}`)

    try {
      const result = await this.runImport(job)
      this.logger.info(`Teamwork Import Job ${job.id} completed successfully.`)
      return result
    } catch (e) {
      const error = asError(e)
      this.logger.error({ err: error }, `Teamwork Import Job ${job.id} failed`)
      throw error
    }
  }

  private async runImport(job: Job<{ domain?: string; apiKey?: string }>) {
    // Configuration
    const { data, id: jobId } = job
    const envDomain = process.env.TEAMWORK_DOMAIN
    const envApiKey = process.env.TEAMWORK_API_KEY

    const DOMAIN = data.domain || envDomain
    const API_KEY = data.apiKey || envApiKey

    if (!DOMAIN || !API_KEY) {
      const error = new Error('Missing Teamwork API credentials.')
      this.logger.error(
        { err: error },
        `[Job ${jobId}] Missing TEAMWORK_DOMAIN or TEAMWORK_API_KEY. Cannot run real migration.`,
      )
      throw error
    }

    const baseURL = `https://${DOMAIN}.teamwork.com`
    const auth = { username: API_KEY, password: '' }

    // Helper: Sleep
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    // Real Client
    const client = axios.create({ baseURL, auth })
    client.interceptors.response.use(null, async error => {
      if (error.response && error.response.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '10', 10)
        this.logger.warn(`[Job ${jobId}] ⚠️ Rate limited. Waiting ${retryAfter}s...`)
        await sleep(retryAfter * 1000 + 1000)
        return client.request(error.config)
      }
      return Promise.reject(error)
    })

    // ID Mappings (Teamwork ID -> Local UUID)
    const userMap = new Map<string, string>() // TW Person ID -> Local User ID
    const projectMap = new Map<string, string>() // TW Project ID -> Local Project ID
    const taskMap = new Map<string, string>() // TW Task ID -> Local Task ID

    this.logger.info(`[Job ${jobId}] 🚀 Starting migration from ${baseURL}...`)

    // --- 1. Users ---
    this.logger.info(`[Job ${jobId}] --- Migrating People ---`)
    try {
      const { data: peopleData } = await client.get('/people.json')
      const people = peopleData.people || []
      this.logger.info(`[Job ${jobId}] Found ${people.length} people.`)

      for (const person of people) {
        const email = person['email-address']
        if (!email) continue

        let user = await this.userService.findOneByEmail(email)
        if (!user) {
          try {
            user = await this.userService.createUserForImport({
              email,
              password: 'password123', // Default password
              role: person['administrator'] ? Role.Admin : Role.User,
            })
            this.logger.info(`[Job ${jobId}] Created user: ${email}`)
          } catch (e) {
            const error = asError(e)
            this.logger.error({ err: error }, `[Job ${jobId}] Failed to create user ${email}`)
            continue
          }
        } else {
          this.logger.debug(`[Job ${jobId}] User exists: ${email}`)
        }
        userMap.set(String(person.id), user.id)
      }
    } catch (e) {
      const error = asError(e)
      this.logger.error({ err: error }, `[Job ${jobId}] Error fetching people`)
      throw error
    }

    // --- 2. Projects ---
    this.logger.info(`[Job ${jobId}] --- Migrating Projects ---`)
    try {
      const { data: projectsData } = await client.get('/projects.json')
      const projects = projectsData.projects || []
      this.logger.info(`[Job ${jobId}] Found ${projects.length} projects.`)

      for (const p of projects) {
        const existing = await this.projectsService.findAll(p.name)
        let project = existing.items.find((ep) => ep.name === p.name)

        if (!project) {
          project = await this.projectsService.create({
            name: p.name,
            description: p.description,
            code: p.name.substring(0, 3).toUpperCase(), // Naive code gen
          })
          this.logger.info(`[Job ${jobId}] Created project: ${p.name}`)
        } else {
          this.logger.debug(`[Job ${jobId}] Project exists: ${p.name}`)
        }
        projectMap.set(String(p.id), project.id)
      }
    } catch (e) {
      const error = asError(e)
      this.logger.error({ err: error }, `[Job ${jobId}] Error fetching projects`)
      throw error
    }

    // --- 4. Tasks ---
    this.logger.info(`[Job ${jobId}] --- Migrating Tasks ---`)
    for (const [twProjectId, localProjectId] of projectMap.entries()) {
      try {
        await sleep(200) // Throttle project iterations
        const { data: tasksData } = await client.get(`/projects/${twProjectId}/tasks.json`)
        const tasks = tasksData['todo-items'] || []
        this.logger.debug(`[Job ${jobId}] Project ${twProjectId}: Found ${tasks.length} tasks.`)

        for (const t of tasks) {
          const existingTasks = await this.tasksService.findAll(localProjectId)
          let task = existingTasks.find((et) => et.name === t.content)

          if (!task) {
            task = await this.tasksService.create(localProjectId, {
              name: t.content,
              description: t.description,
            })
            // Update status
            if (t.completed) {
              await this.tasksService.close(task.id)
            }
          }
          taskMap.set(String(t.id), task.id)
        }
      } catch (e) {
        const error = asError(e)
        this.logger.error(
          { err: error },
          `[Job ${jobId}] Error fetching tasks for project ${twProjectId}`,
        )
        throw error
      }
    }

    // --- 5. Time Entries ---
    this.logger.info(`[Job ${jobId}] --- Migrating Time Entries ---`)
    let page = 1
    let hasMore = true
    let count = 0

    while (hasMore) {
      try {
        await sleep(500) // Throttle paging
        const { data: timeEntriesData } = await client.get(`/time_entries.json?page=${page}`)
        const entries = timeEntriesData['time-entries'] || []
        
        if (entries.length === 0) {
          hasMore = false
          break
        }

        if (entries.length > 0 && page === 1) {
          this.logger.debug(
            { entry: entries[0] },
            `[Job ${jobId}] Sample Time Entry`,
          )
        }

        for (const entry of entries) {
          const personId = String(entry['person-id'])
          const taskId = String(entry['todo-item-id'])

          const localUserId = userMap.get(personId)
          const localTaskId = taskMap.get(taskId)
          
          if (!localUserId || !localTaskId) {
            continue
          }

          const task = await this.tasksService.findOne(localTaskId)
          
          try {
            try {
              await this.projectMembersService.addMember(task.projectId, {
                userId: localUserId,
                role: ProjectRole.MEMBER,
              })
            } catch (err) {
              // Ignore conflict
            }

            const hours = parseInt(entry.hours) || 0
            const mins = parseInt(entry.minutes) || 0
            const totalMinutes = (hours * 60) + mins

            if (totalMinutes <= 0) continue

            const workDate = entry.date.substring(0, 10)

            const wasClosed = task.status === TaskStatus.CLOSED
            if (wasClosed) {
              await this.tasksService.reopen(task.id)
            }

            try {
              await this.timeEntriesService.create(localUserId, {
                taskId: localTaskId,
                workDate,
                minutes: totalMinutes,
                notes: entry.description,
              })
              count++
            } catch (err) {
              const error = asError(err)
              if (!error.message.includes('Time entry already exists')) {
                this.logger.error({ err: error }, `[Job ${jobId}] Failed to log time`)
              }
            }

            if (wasClosed) {
              await this.tasksService.close(task.id)
            }

          } catch (e) {
            const error = asError(e)
            this.logger.error({ err: error }, `[Job ${jobId}] Error processing entry ${entry.id}`)
            throw error
          }
        }

        this.logger.info(`[Job ${jobId}] Processed page ${page} (${entries.length} items)...`)
        page++
      } catch (e) {
        const error = asError(e)
        this.logger.error({ err: error }, `[Job ${jobId}] Error fetching time entries`)
        hasMore = false
        throw error
      }
    }

    this.logger.info(`[Job ${jobId}] Migration Complete! Imported ${count} time entries.`)
    return { message: `Migration Complete! Imported ${count} time entries.` }
  }
}
