import { Injectable, OnModuleInit } from '@nestjs/common'
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import type { Job } from 'bullmq'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import * as xlsx from 'xlsx'
import { promises as fs } from 'fs'
import { UserImportService } from '../user/user-import.service'
import { ProjectsService } from '../projects/projects.service'
import { TasksService } from '../tasks/tasks.service'
import { ProjectMembersService } from '../project-members/project-members.service'
import { TimeEntriesService } from '../time-entries/time-entries.service'
import { Role } from '../user/entities/role.enum'
import { ProjectRole } from '../project-members/entities/project-member.entity'
import { TaskStatus } from '../tasks/entities/task.entity'

const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

const normalizeKey = (value: string) => value.toLowerCase().trim()

const normalizeRow = (row: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]))

const parseTeamworkId = (value: unknown) => {
  if (value === null || value === undefined) return null
  const raw = String(value).trim()
  return raw.length > 0 ? raw : null
}

const parseDate = (value: unknown) => {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split('T')[0]
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  }
  return null
}

const parseNumber = (value: unknown) => {
  if (typeof value === 'number' && !isNaN(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (!isNaN(parsed)) return parsed
  }
  return 0
}

const parseEmailFromText = (value: unknown) => {
  if (typeof value !== 'string') return null
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match ? match[0].toLowerCase() : null
}

const parseProjectInfo = (value: unknown) => {
  if (typeof value !== 'string') return { name: null, code: null }
  const trimmed = value.trim()
  const match = trimmed.match(/^\[([^\]]+)\]\s*(.+)$/)
  if (match) {
    return { name: match[2].trim(), code: match[1].trim() }
  }
  return { name: trimmed || null, code: null }
}

@Processor('teamwork-excel-import', { lockDuration: 10 * 60 * 1000 })
@Injectable()
export class TeamworkExcelImportJob extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly userService: UserImportService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly projectMembersService: ProjectMembersService,
    private readonly timeEntriesService: TimeEntriesService,
    @InjectPinoLogger(TeamworkExcelImportJob.name)
    private readonly logger: PinoLogger,
  ) {
    super()
  }

  onModuleInit() {
    this.logger.info('Teamwork excel import worker ready')
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

  async process(job: Job<{ filePath?: string }>) {
    this.logger.info(`Starting Teamwork Excel Import Job ${job.id}`)

    try {
      const result = await this.runImport(job)
      this.logger.info(`Teamwork Excel Import Job ${job.id} completed successfully.`)
      return result
    } catch (e) {
      const error = asError(e)
      this.logger.error({ err: error }, `Teamwork Excel Import Job ${job.id} failed`)
      throw error
    }
  }

  private async runImport(job: Job<{ filePath?: string }>) {
    const { filePath } = job.data
    if (!filePath) {
      throw new Error('Missing filePath for Teamwork Excel import job')
    }

    await fs.stat(filePath)

    const workbook = xlsx.readFile(filePath, { cellDates: true })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      throw new Error('Excel file has no sheets')
    }

    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null })
    if (rows.length === 0) {
      return { message: 'No rows found in Teamwork report.' }
    }

    const projectCache = new Map<string, string>()
    const projectNameCache = new Map<string, string>()
    const taskCache = new Map<string, string>()
    const taskNameCache = new Map<string, string>()
    const userCache = new Map<string, string>()

    let count = 0

    for (const rawRow of rows) {
      const row = normalizeRow(rawRow as Record<string, unknown>)

      const teamworkEntryId = parseTeamworkId(row['id'])
      const teamworkTaskId = parseTeamworkId(row['task id'])
      const teamworkProjectId = parseTeamworkId(row['project id'])
      const teamworkUserId = parseTeamworkId(row['user id'])

      if (teamworkEntryId) {
        const existing = await this.timeEntriesService.findOneByTeamworkId(teamworkEntryId)
        if (existing) {
          continue
        }
      }

      const projectInfo = parseProjectInfo(row['project'])
      if (!projectInfo.name) {
        this.logger.warn({ row }, 'Skipping row without project name')
        continue
      }

      let projectId = teamworkProjectId ? projectCache.get(teamworkProjectId) : undefined
      if (!projectId && teamworkProjectId) {
        const project = await this.projectsService.findByTeamworkId(teamworkProjectId)
        if (project) {
          projectId = project.id
          projectCache.set(teamworkProjectId, project.id)
          projectNameCache.set(project.name.toLowerCase(), project.id)
        }
      }

      if (!projectId) {
        const nameKey = projectInfo.name.toLowerCase()
        projectId = projectNameCache.get(nameKey)
        if (!projectId) {
          const existing = await this.projectsService.findAll(projectInfo.name)
          const match = existing.items.find(item => item.name === projectInfo.name)
          if (match) {
            projectId = match.id
            projectNameCache.set(nameKey, match.id)
            if (teamworkProjectId && !match.teamworkId) {
              await this.projectsService.update(match.id, { teamworkId: teamworkProjectId })
            }
          }
        }
      }

      if (!projectId) {
        const created = await this.projectsService.create({
          name: projectInfo.name,
          code: projectInfo.code ?? undefined,
          teamworkId: teamworkProjectId ?? undefined,
        })
        projectId = created.id
        projectNameCache.set(projectInfo.name.toLowerCase(), created.id)
        if (teamworkProjectId) {
          projectCache.set(teamworkProjectId, created.id)
        }
      }

      const taskNameValue = typeof row['task'] === 'string' ? row['task'].trim() : null
      if (!taskNameValue) {
        this.logger.warn({ row }, 'Skipping row without task name')
        continue
      }

      let taskId = teamworkTaskId ? taskCache.get(teamworkTaskId) : undefined
      if (!taskId && teamworkTaskId) {
        const task = await this.tasksService.findByTeamworkId(teamworkTaskId)
        if (task) {
          taskId = task.id
          taskCache.set(teamworkTaskId, task.id)
          taskNameCache.set(`${task.projectId}:${task.name.toLowerCase()}`, task.id)
        }
      }

      if (!taskId) {
        const taskKey = `${projectId}:${taskNameValue.toLowerCase()}`
        taskId = taskNameCache.get(taskKey)
        if (!taskId) {
          const existingTasks = await this.tasksService.findAll(projectId)
          const match = existingTasks.find(item => item.name === taskNameValue)
          if (match) {
            taskId = match.id
            taskNameCache.set(taskKey, match.id)
            if (teamworkTaskId && !match.teamworkId) {
              await this.tasksService.update(match.id, { teamworkId: teamworkTaskId })
            }
          }
        }
      }

      if (!taskId) {
        const createdTask = await this.tasksService.create(projectId, {
          name: taskNameValue,
          teamworkId: teamworkTaskId ?? undefined,
        })
        taskId = createdTask.id
        taskNameCache.set(`${projectId}:${taskNameValue.toLowerCase()}`, createdTask.id)
        if (teamworkTaskId) {
          taskCache.set(teamworkTaskId, createdTask.id)
        }
      }

      const emailFromWho = parseEmailFromText(row['who'])
      const userKey = emailFromWho ?? teamworkUserId ?? null
      if (!userKey) {
        this.logger.warn({ row }, 'Skipping row without user identifier')
        continue
      }

      let userId = userCache.get(userKey)
      if (!userId) {
        const email = emailFromWho ?? `teamwork-${userKey}@import.local`
        let user = await this.userService.findOneByEmail(email)
        if (!user) {
          user = await this.userService.createUserForImport({
            email,
            password: 'password123',
            role: Role.User,
          })
        }
        userId = user.id
        userCache.set(userKey, user.id)
      }

      const workDate = parseDate(row['date'] ?? row['date/time'])
      if (!workDate) {
        this.logger.warn({ row }, 'Skipping row without work date')
        continue
      }

      const hours = parseNumber(row['hours'])
      const minutes = parseNumber(row['minutes'])
      const decimalHours = parseNumber(row['decimal hours'])
      const totalMinutes = Math.round(
        (hours * 60) + minutes || (decimalHours * 60),
      )

      if (totalMinutes <= 0) {
        continue
      }

      const existingByUnique = await this.timeEntriesService.findOneByUserTaskDate(
        userId,
        taskId,
        workDate,
      )
      if (existingByUnique) {
        if (teamworkEntryId && !existingByUnique.teamworkId) {
          await this.timeEntriesService.setTeamworkId(existingByUnique.id, teamworkEntryId)
        }
        continue
      }

      const task = await this.tasksService.findOne(taskId)

      try {
        try {
          await this.projectMembersService.addMember(task.projectId, {
            userId,
            role: ProjectRole.MEMBER,
          })
        } catch (err) {
          // Ignore conflict
        }

        const wasClosed = task.status === TaskStatus.CLOSED
        if (wasClosed) {
          await this.tasksService.reopen(task.id)
        }

        await this.timeEntriesService.create(userId, {
          taskId,
          workDate,
          minutes: totalMinutes,
          notes: typeof row['description'] === 'string' ? row['description'] : undefined,
          teamworkId: teamworkEntryId ?? undefined,
        })

        if (wasClosed) {
          await this.tasksService.close(task.id)
        }

        count++
      } catch (e) {
        const error = asError(e)
        if (!error.message.includes('Time entry already exists')) {
          this.logger.error({ err: error }, 'Failed to log time entry')
        }
      }
    }

    this.logger.info(`Excel import complete. Imported ${count} time entries.`)
    return { message: `Excel import complete. Imported ${count} time entries.` }
  }
}
