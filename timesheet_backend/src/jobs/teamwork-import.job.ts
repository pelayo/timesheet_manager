import { Injectable, OnModuleInit } from '@nestjs/common'
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import type { Job } from 'bullmq'
import axios from 'axios'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { UserImportService } from '../user/user-import.service'
import { ProjectsService } from '../projects/projects.service'
import { TasksService } from '../tasks/tasks.service'
import { ProjectMembersService } from '../project-members/project-members.service'
import { TimeEntriesService } from '../time-entries/time-entries.service'
import { Role } from '../user/entities/role.enum'
import { ProjectRole } from '../project-members/entities/project-member.entity'
import { TaskStatus } from '../tasks/entities/task.entity'
import { DEFAULT_TEAMWORK_TASK_NAME } from './teamwork-import.helpers'

const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

@Processor('teamwork-import', { lockDuration: 10 * 60 * 1000 })
@Injectable()
export class TeamworkImportJob extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly userService: UserImportService,
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

  async process(job: Job<{ domain?: string; apiKey?: string; since?: string }>) {
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

  private async runImport(job: Job<{ domain?: string; apiKey?: string; since?: string }>) {
    // Configuration
    const { data, id: jobId } = job
    const envDomain = process.env.TEAMWORK_DOMAIN
    const envApiKey = process.env.TEAMWORK_API_KEY

    const DOMAIN = data.domain || envDomain
    const API_KEY = data.apiKey || envApiKey
    const since = data.since

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
    const defaultTaskMap = new Map<string, string>() // Project ID -> Default Task ID

    const fromDate = this.normalizeSinceDate(since)
    if (fromDate) {
      this.logger.info(`[Job ${jobId}] Using fromdate filter: ${fromDate}`)
    }

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
        const teamworkId = String(p.id)
        let project = await this.projectsService.findByTeamworkId(teamworkId)
        if (!project) {
          const existing = await this.projectsService.findAll(p.name)
          project = existing.items.find((ep) => ep.name === p.name) ?? null
        }

        if (!project) {
          project = await this.projectsService.create({
            name: p.name,
            description: p.description,
            code: p.name.substring(0, 3).toUpperCase(), // Naive code gen
            teamworkId,
          })
          this.logger.info(`[Job ${jobId}] Created project: ${p.name}`)
        } else {
          if (!project.teamworkId) {
            await this.projectsService.update(project.id, { teamworkId })
          }
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
          const teamworkId = String(t.id)
          let task = await this.tasksService.findByTeamworkId(teamworkId)
          if (!task) {
            const existingTasks = await this.tasksService.findAll(localProjectId)
            task = existingTasks.find((et) => et.name === t.content) ?? null
          }

          if (!task) {
            task = await this.tasksService.create(localProjectId, {
              name: t.content,
              description: t.description,
              teamworkId,
            })
            // Update status
            if (t.completed) {
              await this.tasksService.close(task.id)
            }
          } else if (!task.teamworkId) {
            await this.tasksService.update(task.id, { teamworkId })
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
    let recoveredMissingTaskCount = 0

    const getDefaultTaskId = async (projectId: string) => {
      const cached = defaultTaskMap.get(projectId)
      if (cached) return cached

      const existingTasks = await this.tasksService.findAll(projectId)
      let task = existingTasks.find(item => item.name === DEFAULT_TEAMWORK_TASK_NAME) ?? null
      if (!task) {
        task = await this.tasksService.create(projectId, {
          name: DEFAULT_TEAMWORK_TASK_NAME,
        })
      }

      defaultTaskMap.set(projectId, task.id)
      return task.id
    }

    while (hasMore) {
      try {
        await sleep(500) // Throttle paging
        const params: Record<string, string | number> = { page }
        if (fromDate) {
          params.fromdate = fromDate
        }
        const { data: timeEntriesData } = await client.get('/time_entries.json', { params })
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
          const teamworkId = String(entry.id)
          const personId = String(entry['person-id'])
          const taskId = String(entry['todo-item-id'])
          const projectId = entry['project-id'] ? String(entry['project-id']) : null

          const localUserId = userMap.get(personId)
          const localProjectId = projectId ? projectMap.get(projectId) : undefined
          let localTaskId = taskMap.get(taskId)
          
          if (!localTaskId && localProjectId) {
            localTaskId = await getDefaultTaskId(localProjectId)
            recoveredMissingTaskCount++
          }

          if (!localUserId || !localTaskId) {
            continue
          }

          const task = await this.tasksService.findOne(localTaskId)

          if (teamworkId) {
            const existingByTeamwork = await this.timeEntriesService.findOneByTeamworkId(teamworkId)
            if (existingByTeamwork) {
              continue
            }
          }
          
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
            const existingByUnique = await this.timeEntriesService.findOneByUserTaskDate(
              localUserId,
              localTaskId,
              workDate,
            )
            if (existingByUnique) {
              if (teamworkId && !existingByUnique.teamworkId) {
                await this.timeEntriesService.setTeamworkId(existingByUnique.id, teamworkId)
              }
              continue
            }

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
                teamworkId,
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

    this.logger.info(
      `[Job ${jobId}] Migration Complete! Imported ${count} time entries. Recovered ${recoveredMissingTaskCount} entries without tasks.`,
    )
    return {
      message: `Migration Complete! Imported ${count} time entries. Recovered ${recoveredMissingTaskCount} entries without tasks.`,
    }
  }

  private normalizeSinceDate(since?: string) {
    if (!since) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(since)) {
      return since.replace(/-/g, '')
    }
    const parsed = new Date(since)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid since date provided for Teamwork import')
    }
    const year = parsed.getUTCFullYear()
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
    const day = String(parsed.getUTCDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }
}
