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

const MOCK_MODE = !DOMAIN || !API_KEY;

if (MOCK_MODE) {
  console.warn('⚠️  No credentials found. Running in MOCK MODE (Generating synthetic data).');
} else {
    console.log(`🚀 Starting REAL migration from https://${DOMAIN}.teamwork.com...`);
}

const baseURL = MOCK_MODE ? 'http://mock-teamwork' : `https://${DOMAIN}.teamwork.com`;
const auth = MOCK_MODE ? undefined : { username: API_KEY, password: '' };

// Helper: Sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Generators
const mockPeople = Array.from({ length: 10 }, (_, i) => ({
    id: `p${i}`,
    'email-address': `user${i}@example.com`,
    administrator: i === 0,
    'first-name': `User`,
    'last-name': `${i}`
}));

const mockProjects = Array.from({ length: 5 }, (_, i) => ({
    id: `proj${i}`,
    name: `Project ${String.fromCharCode(65 + i)}`,
    description: `Imported Project ${i}`
}));

const mockTasks = (projId: string) => Array.from({ length: 10 }, (_, i) => ({
    id: `t${projId}_${i}`,
    content: `Task ${i} for ${projId}`,
    description: `Description ${i}`,
    completed: i % 3 === 0
}));

// Generate Time Entries
const mockTimeEntries = (page: number) => {
    if (page > 5) return []; // 5 pages of 50 entries = 250 entries
    return Array.from({ length: 50 }, (_, i) => {
        const pIdx = Math.floor(Math.random() * 10);
        const projIdx = Math.floor(Math.random() * 5);
        const tIdx = Math.floor(Math.random() * 10);
        
        // Random date in last 6 months
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 180));
        
        return {
            id: `te_${page}_${i}`,
            'person-id': `p${pIdx}`,
            'todo-item-id': `tproj${projIdx}_${tIdx}`,
            hours: String(Math.floor(Math.random() * 8)),
            minutes: String(Math.floor(Math.random() * 4) * 15),
            date: date.toISOString(),
            description: 'Mock work'
        };
    });
};

// Axios Client Wrapper
const getClient = () => {
    if (MOCK_MODE) {
        return {
            get: async (url: string) => {
                await sleep(50); // Fast mock
                if (url === '/people.json') return { data: { people: mockPeople } };
                if (url === '/projects.json') return { data: { projects: mockProjects } };
                if (url.match(/\/projects\/.*\/tasks.json/)) {
                     const pid = url.split('/')[2];
                     return { data: { 'todo-items': mockTasks(pid) } };
                }
                if (url.startsWith('/time_entries.json')) {
                    const page = parseInt(url.split('page=')[1] || '1');
                    return { data: { 'time-entries': mockTimeEntries(page) } };
                }
                return { data: {} };
            },
            interceptors: { response: { use: () => {} } }
        };
    }
    
    // Real Client
    const client = axios.create({ baseURL, auth });
    client.interceptors.response.use(null, async (error) => {
        if (error.response && error.response.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'] || '10', 10);
            console.warn(`⚠️ Rate limited. Waiting ${retryAfter}s...`);
            await sleep(retryAfter * 1000 + 1000); 
            return client.request(error.config);
        }
        return Promise.reject(error);
    });
    return client;
};

const client = getClient();

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
      userMap.set(String(person.id), user.id);
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
      let project = existing.items.find((ep) => ep.name === p.name);

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
      projectMap.set(String(p.id), project.id);

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
        taskMap.set(String(t.id), task.id);
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

      if (entries.length > 0 && page === 1) {
          console.log('Sample Time Entry:', JSON.stringify(entries[0], null, 2));
      }

      for (const entry of entries) {
        // Teamwork IDs are often strings in JSON but might be numbers. Cast to string for Map lookup.
        const personId = String(entry['person-id']);
        const taskId = String(entry['todo-item-id']);

        const localUserId = userMap.get(personId);
        const localTaskId = taskMap.get(taskId);
        
        if (!localUserId || !localTaskId) {
            // console.warn(`Skipping entry: User ${personId} (Found? ${!!localUserId}) or Task ${taskId} (Found? ${!!localTaskId}) not found locally.`);
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
