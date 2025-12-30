import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { PgBoss } from '@nestjs-enhanced/pg-boss';
import type { Job } from 'pg-boss';
import axios from 'axios';
import { UserService } from '../user/user.service';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { ProjectMembersService } from '../project-members/project-members.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { ConfigService } from '../config/config.service';
import { Role } from '../user/entities/role.enum';
import { ProjectRole } from '../project-members/entities/project-member.entity';
import { TaskStatus } from '../tasks/entities/task.entity';

@Injectable()
export class TeamworkImportJob implements OnModuleInit {
  private readonly logger: Logger;

  constructor(
    @Inject(PgBoss) private readonly pgBoss: PgBoss,
    private readonly userService: UserService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly projectMembersService: ProjectMembersService,
    private readonly timeEntriesService: TimeEntriesService,
    private readonly configService: ConfigService,
  ) {
      this.logger = new Logger(TeamworkImportJob.name);
  }

  async onModuleInit() {
    this.logger.log('Registering teamwork-import worker');
    await this.pgBoss.work('teamwork-import', this.handle.bind(this));
  }

  async handle(job: Job<{ domain?: string; apiKey?: string }>) {
    this.logger.log(`Starting Teamwork Import Job ${job.id}`);

    try {
        const result = await this.runImport(job);
        this.logger.log(`Teamwork Import Job ${job.id} completed successfully.`);
        return result;
    } catch (e) {
        this.logger.error(`Teamwork Import Job ${job.id} failed: ${e.message}`, e.stack);
        throw e;
    }
  }

  private async runImport(job: Job<{ domain?: string; apiKey?: string }>) {
    // Configuration
    const { data, id: jobId } = job;
    const envDomain = process.env.TEAMWORK_DOMAIN;
    const envApiKey = process.env.TEAMWORK_API_KEY;

    const DOMAIN = data.domain || envDomain;
    const API_KEY = data.apiKey || envApiKey;

    if (!DOMAIN || !API_KEY) {
      this.logger.error(`[Job ${jobId}] Missing TEAMWORK_DOMAIN or TEAMWORK_API_KEY. Cannot run real migration.`);
      throw new Error('Missing Teamwork API credentials.');
    }

    const baseURL = `https://${DOMAIN}.teamwork.com`;
    const auth = { username: API_KEY, password: '' };

    // Helper: Sleep
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Real Client
    const client = axios.create({ baseURL, auth });
    client.interceptors.response.use(null, async (error) => {
        if (error.response && error.response.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'] || '10', 10);
            this.logger.warn(`[Job ${jobId}] ⚠️ Rate limited. Waiting ${retryAfter}s...`);
            await sleep(retryAfter * 1000 + 1000); 
            return client.request(error.config);
        }
        return Promise.reject(error);
    });

    // ID Mappings (Teamwork ID -> Local UUID)
    const userMap = new Map<string, string>(); // TW Person ID -> Local User ID
    const projectMap = new Map<string, string>(); // TW Project ID -> Local Project ID
    const taskMap = new Map<string, string>(); // TW Task ID -> Local Task ID

    this.logger.log(`[Job ${jobId}] 🚀 Starting migration from ${baseURL}...`);

    // --- 1. Users ---
    this.logger.log(`[Job ${jobId}] --- Migrating People ---`);
    try {
      const { data: peopleData } = await client.get('/people.json');
      const people = peopleData.people || [];
      this.logger.log(`[Job ${jobId}] Found ${people.length} people.`);

      for (const person of people) {
        const email = person['email-address'];
        if (!email) continue;

        let user = await this.userService.findOneByEmail(email);
        if (!user) {
          try {
            user = await this.userService.createUser({
              email,
              password: 'password123', // Default password
              role: person['administrator'] ? Role.Admin : Role.User,
            });
            this.logger.log(`[Job ${jobId}] Created user: ${email}`);
          } catch (e) {
            this.logger.error(`[Job ${jobId}] Failed to create user ${email}:`, e.message);
            continue;
          }
        } else {
          this.logger.debug(`[Job ${jobId}] User exists: ${email}`);
        }
        userMap.set(String(person.id), user.id);
      }
    } catch (e) {
      this.logger.error(`[Job ${jobId}] Error fetching people:`, e.message);
      throw e;
    }

    // --- 2. Projects ---
    this.logger.log(`[Job ${jobId}] --- Migrating Projects ---`);
    try {
      const { data: projectsData } = await client.get('/projects.json');
      const projects = projectsData.projects || [];
      this.logger.log(`[Job ${jobId}] Found ${projects.length} projects.`);

      for (const p of projects) {
        const existing = await this.projectsService.findAll(p.name);
        let project = existing.items.find((ep) => ep.name === p.name);

        if (!project) {
          project = await this.projectsService.create({
            name: p.name,
            description: p.description,
            code: p.name.substring(0, 3).toUpperCase(), // Naive code gen
          });
          this.logger.log(`[Job ${jobId}] Created project: ${p.name}`);
        } else {
          this.logger.debug(`[Job ${jobId}] Project exists: ${p.name}`);
        }
        projectMap.set(String(p.id), project.id);
      }
    } catch (e) {
      this.logger.error(`[Job ${jobId}] Error fetching projects:`, e.message);
      throw e;
    }

    // --- 4. Tasks ---
    this.logger.log(`[Job ${jobId}] --- Migrating Tasks ---`);
    for (const [twProjectId, localProjectId] of projectMap.entries()) {
      try {
        await sleep(200); // Throttle project iterations
        const { data: tasksData } = await client.get(`/projects/${twProjectId}/tasks.json`);
        const tasks = tasksData['todo-items'] || [];
        this.logger.debug(`[Job ${jobId}] Project ${twProjectId}: Found ${tasks.length} tasks.`);

        for (const t of tasks) {
          const existingTasks = await this.tasksService.findAll(localProjectId);
          let task = existingTasks.find((et) => et.name === t.content);

          if (!task) {
            task = await this.tasksService.create(localProjectId, {
              name: t.content,
              description: t.description,
            });
            // Update status
            if (t.completed) {
              await this.tasksService.close(task.id);
            }
          }
          taskMap.set(String(t.id), task.id);
        }
      } catch (e) {
        this.logger.error(`[Job ${jobId}] Error fetching tasks for project ${twProjectId}:`, e.message);
        throw e;
      }
    }

    // --- 5. Time Entries ---
    this.logger.log(`[Job ${jobId}] --- Migrating Time Entries ---`);
    let page = 1;
    let hasMore = true;
    let count = 0;

    while (hasMore) {
      try {
        await sleep(500); // Throttle paging
        const { data: timeEntriesData } = await client.get(`/time_entries.json?page=${page}`);
        const entries = timeEntriesData['time-entries'] || [];
        
        if (entries.length === 0) {
          hasMore = false;
          break;
        }

        if (entries.length > 0 && page === 1) {
          this.logger.debug(`[Job ${jobId}] Sample Time Entry: ` + JSON.stringify(entries[0], null, 2));
        }

        for (const entry of entries) {
          const personId = String(entry['person-id']);
          const taskId = String(entry['todo-item-id']);

          const localUserId = userMap.get(personId);
          const localTaskId = taskMap.get(taskId);
          
          if (!localUserId || !localTaskId) {
            continue;
          }

          const task = await this.tasksService.findOne(localTaskId);
          
          try {
            try {
                await this.projectMembersService.addMember(task.projectId, { userId: localUserId, role: ProjectRole.MEMBER });
            } catch (err) {
                // Ignore conflict
            }

            const hours = parseInt(entry.hours) || 0;
            const mins = parseInt(entry.minutes) || 0;
            const totalMinutes = (hours * 60) + mins;

            if (totalMinutes <= 0) continue;

            const workDate = entry.date.substring(0, 10); 

            const wasClosed = task.status === TaskStatus.CLOSED;
            if (wasClosed) {
                await this.tasksService.reopen(task.id);
            }

            try {
              await this.timeEntriesService.create(localUserId, {
                taskId: localTaskId,
                workDate,
                minutes: totalMinutes,
                notes: entry.description,
              });
              count++;
            } catch (err) {
              if (!err.message.includes('Time entry already exists')) {
                this.logger.error(`[Job ${jobId}] Failed to log time: ${err.message}`);
              }
            }

            if (wasClosed) {
                await this.tasksService.close(task.id);
            }

          } catch (e) {
            this.logger.error(`[Job ${jobId}] Error processing entry ${entry.id}:`, e.message);
            throw e;
          }
        }

        this.logger.log(`[Job ${jobId}] Processed page ${page} (${entries.length} items)...`);
        page++;
      } catch (e) {
        this.logger.error(`[Job ${jobId}] Error fetching time entries:`, e.message);
        hasMore = false;
        throw e;
      }
    }

    this.logger.log(`[Job ${jobId}] Migration Complete! Imported ${count} time entries.`);
    return { message: `Migration Complete! Imported ${count} time entries.` };
  }
}
