import 'dotenv/config';
import { ContextIdFactory, NestFactory } from '@nestjs/core';
import axios from 'axios';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { ProjectMembersService } from '../project-members/project-members.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { Role } from '../user/entities/role.enum';
import { User } from '../user/entities/user.entity';
import { ProjectRole } from '../project-members/entities/project-member.entity';
import { TaskStatus } from '../tasks/entities/task.entity';

// Configuration
const DOMAIN = process.env.TEAMWORK_DOMAIN; // e.g. "mycompany" (becomes mycompany.teamwork.com)
const API_KEY = process.env.TEAMWORK_API_KEY;

if (!DOMAIN || !API_KEY) {
  console.error('Please provide TEAMWORK_DOMAIN and TEAMWORK_API_KEY env variables.');
  process.exit(1);
}

const baseURL = `https://${DOMAIN}.teamwork.com`;
const auth = { username: API_KEY, password: '' }; // Basic Auth with API Key as username

// Helper: Sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Axios instance with interceptor for 429
const client = axios.create({
  baseURL: `https://${DOMAIN}.teamwork.com`,
  auth,
});

client.interceptors.response.use(null, async (error) => {
  if (error.response && error.response.status === 429) {
    const retryAfter = parseInt(error.response.headers['retry-after'] || '10', 10);
    console.warn(`⚠️ Rate limited. Waiting ${retryAfter}s...`);
    await sleep(retryAfter * 1000 + 1000); // Wait + buffer
    return client.request(error.config);
  }
  return Promise.reject(error);
});

// ID Mappings (Teamwork ID -> Local UUID)
const userMap = new Map<string, string>(); // TW Person ID -> Local User ID
const projectMap = new Map<string, string>(); // TW Project ID -> Local Project ID
const taskMap = new Map<string, string>(); // TW Task ID -> Local Task ID

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Mock Admin Actor for Service Security Checks
  const adminActor = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'system-migration@local',
    role: Role.Admin,
  } as User;

  const contextId = ContextIdFactory.create();
  app.registerRequestByContextId({ user: adminActor }, contextId);

  const userService = await app.resolve(UserService, contextId);
  const projectsService = await app.resolve(ProjectsService, contextId);
  const tasksService = await app.resolve(TasksService, contextId);
  const membersService = await app.resolve(ProjectMembersService, contextId);
  const timeEntriesService = await app.resolve(TimeEntriesService, contextId);

  console.log(`🚀 Starting migration from ${baseURL}...`);

  // --- 1. Users ---
  console.log('--- Migrating People ---');
  try {
    const { data } = await client.get('/people.json');
    const people = data.people || [];
    console.log(`Found ${people.length} people.`);

    for (const person of people) {
      const email = person['email-address'];
      if (!email) continue;

      let user = await userService.findOneByEmail(email);
      if (!user) {
        try {
          user = await userService.createUser({
            email,
            password: 'password123', // Default password
            role: person['administrator'] ? Role.Admin : Role.User,
          });
          console.log(`Created user: ${email}`);
        } catch (e) {
          console.error(`Failed to create user ${email}:`, e.message);
          continue;
        }
      } else {
        console.log(`User exists: ${email}`);
      }
      userMap.set(person.id, user.id);
    }
  } catch (e) {
    console.error('Error fetching people:', e.message);
  }

  // --- 2. Projects ---
  console.log('--- Migrating Projects ---');
  try {
    const { data } = await client.get('/projects.json');
    const projects = data.projects || [];
    console.log(`Found ${projects.length} projects.`);

    for (const p of projects) {
      const existing = await projectsService.findAll(p.name);
      let project = existing.find((ep) => ep.name === p.name);

      if (!project) {
        project = await projectsService.create({
          name: p.name,
          description: p.description,
          code: p.name.substring(0, 3).toUpperCase(), // Naive code gen
        });
        console.log(`Created project: ${p.name}`);
      } else {
        console.log(`Project exists: ${p.name}`);
      }
      projectMap.set(p.id, project.id);

      // --- 3. Project Members (Assign mapped users) ---
      // We assume mostly everyone is a member or we fetch project people?
      // Simpler: Fetch project people per project or just assign all known users if specific API call is too much.
      // Teamwork doesn't send people in project list.
      // Let's just Add User to Project if we encounter a Task/TimeEntry for them later?
      // No, create/TimeEntry requires membership.
      // Strategy: When processing TimeEntries, if user not member, add them.
      // OR: Just add ALL migrated users to ALL migrated projects to be safe (if small team).
      // Let's try to be specific if possible, but for MVP migration script, let's Lazy Add.
    }
  } catch (e) {
    console.error('Error fetching projects:', e.message);
  }

  // --- 4. Tasks ---
  console.log('--- Migrating Tasks ---');
  for (const [twProjectId, localProjectId] of projectMap.entries()) {
    try {
      await sleep(200); // Throttle project iterations
      // Pagination might be needed for tasks, but usually < 500 per project
      const { data } = await client.get(`/projects/${twProjectId}/tasks.json`);
      const tasks = data['todo-items'] || [];
      console.log(`Project ${twProjectId}: Found ${tasks.length} tasks.`);

      for (const t of tasks) {
        // Check duplication by name in project?
        const existingTasks = await tasksService.findAll(localProjectId);
        let task = existingTasks.find((et) => et.name === t.content);

        if (!task) {
          task = await tasksService.create(localProjectId, {
            name: t.content,
            description: t.description,
          });
          // Update status
          if (t.completed) {
            await tasksService.close(task.id);
          }
        }
        taskMap.set(t.id, task.id);
      }
    } catch (e) {
      console.error(`Error fetching tasks for project ${twProjectId}:`, e.message);
    }
  }

  // --- 5. Time Entries ---
  console.log('--- Migrating Time Entries ---');
  let page = 1;
  let hasMore = true;
  let count = 0;

  while (hasMore) {
    try {
      await sleep(500); // Throttle paging
      const { data } = await client.get(`/time_entries.json?page=${page}`);
      const entries = data['time-entries'] || [];
      
      if (entries.length === 0) {
        hasMore = false;
        break;
      }

      for (const entry of entries) {
        const localUserId = userMap.get(entry['person-id']);
        const localTaskId = taskMap.get(entry['todo-item-id']);
        
        // If task is not mapped (maybe deleted in TW or sub-task?), try to map to Project Generic Task?
        // Or skip.
        if (!localUserId || !localTaskId) {
            // console.warn(`Skipping entry: User ${entry['person-id']} or Task ${entry['todo-item-id']} not found locally.`);
            continue;
        }

        // Get Project ID from Task (to ensure membership)
        const task = await tasksService.findOne(localTaskId);
        
        // Ensure Membership
        try {
            // Check if member logic is inside service, but we can pre-check or just try-catch the create.
            // But create() throws Forbidden.
            // Let's "Ensure Membership" helper.
            // We can't easily access membersService.findOne directly inside loop efficiently? 
            // We'll trust the error.
            
            // Hack: Just add member blindly (it throws Conflict if exists, which we catch).
            try {
                await membersService.addMember(task.projectId, { userId: localUserId, role: ProjectRole.MEMBER });
            } catch (err) {
                // Ignore conflict (already member)
            }

            // Convert duration: HH:MM to minutes
            const hours = parseInt(entry.hours) || 0;
            const mins = parseInt(entry.minutes) || 0;
            const totalMinutes = (hours * 60) + mins;

            if (totalMinutes <= 0) continue;

            const workDate = entry.date.substring(0, 10); // YYYY-MM-DDT... -> YYYY-MM-DD

            // Ensure task is OPEN (if we closed it in step 4, we must reopen temporarily? 
            // Or service create checks status.
            // Migration should bypass status checks?
            // The service `create` method DOES check for CLOSED status.
            // We should Reopen -> Log -> Close if needed.
            // Or better: Use Repository directly to bypass Service logic?
            // Using Repository directly is safer for migration to bypass business rules (like "Task must be open").
            // But we need to use `TimeEntriesService`? No, we can resolve Repository.
            
            // Let's resolve Repository to bypass rules.
            // But `TimeEntriesService` has logic for uniqueness.
            // The constraint is DB level too.
            
            // Re-opening task is safer to keep logic consistent.
            const wasClosed = task.status === TaskStatus.CLOSED;
            if (wasClosed) {
                await tasksService.reopen(task.id);
            }

            try {
                await timeEntriesService.create(localUserId, {
                    taskId: localTaskId,
                    workDate,
                    minutes: totalMinutes,
                    notes: entry.description,
                });
                count++;
            } catch (err) {
                if (!err.message.includes('Time entry already exists')) {
                    console.error(`Failed to log time: ${err.message}`);
                }
            }

            if (wasClosed) {
                await tasksService.close(task.id);
            }

        } catch (e) {
            console.error(`Error processing entry ${entry.id}:`, e.message);
        }
      }

      console.log(`Processed page ${page} (${entries.length} items)...`);
      page++;
    } catch (e) {
      console.error('Error fetching time entries:', e.message);
      hasMore = false;
    }
  }

  console.log(`Migration Complete! Imported ${count} time entries.`);
  await app.close();
}

bootstrap();
