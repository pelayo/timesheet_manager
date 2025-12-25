import 'dotenv/config'
import { ContextIdFactory, NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { UserService } from '../user/user.service'
import { ProjectsService } from '../projects/projects.service'
import { TasksService } from '../tasks/tasks.service'
import { ProjectMembersService } from '../project-members/project-members.service'
import { TimeEntriesService } from '../time-entries/time-entries.service'
import { Role } from '../user/entities/role.enum'
import { User } from '../user/entities/user.entity'
import { ProjectRole } from '../project-members/entities/project-member.entity'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)

  // Mock Admin Actor
  const adminActor = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'admin@local',
    role: Role.Admin,
  } as User

  const contextId = ContextIdFactory.create()
  app.registerRequestByContextId({ user: adminActor }, contextId)

  // Resolve Services
  const userService = await app.resolve(UserService, contextId)
  const projectsService = await app.resolve(ProjectsService, contextId)
  const tasksService = await app.resolve(TasksService, contextId)
  const membersService = await app.resolve(ProjectMembersService, contextId)
  const timeEntriesService = await app.resolve(TimeEntriesService, contextId)

  console.log('Seeding data...')

  // 1. Create Users
  let adminUser: User;
  try {
      adminUser = await userService.createUser({
        email: 'admin@example.com',
        password: 'password',
        role: Role.Admin,
      })
      console.log('Created Admin:', adminUser.email)
  } catch (e) {
      console.log('Admin probably exists')
      adminUser = (await userService.findOneByEmail('admin@example.com'))!
  }

  let workerUser: User;
  try {
      workerUser = await userService.createUser({
        email: 'worker@example.com',
        password: 'password',
        role: Role.User,
      })
      console.log('Created Worker:', workerUser.email)
  } catch (e) {
      console.log('Worker probably exists')
      workerUser = (await userService.findOneByEmail('worker@example.com'))!
  }

  // 2. Create Projects
  const projectA = await projectsService.create({ name: 'Project Alpha', code: 'ALP' })
  console.log('Created Project:', projectA.name)

  const projectB = await projectsService.create({ name: 'Project Beta', code: 'BET' })
  console.log('Created Project:', projectB.name)

  // 3. Create Tasks
  const createOrGetTask = async (pid: string, name: string, desc: string) => {
      const existing = await tasksService.findAll(pid);
      const found = existing.find(t => t.name === name);
      if (found) {
          console.log(`Task exists: ${name}`);
          return found;
      }
      const created = await tasksService.create(pid, { name, description: desc });
      console.log(`Created Task: ${name}`);
      return created;
  };

  const taskA1 = await createOrGetTask(projectA.id, 'Design Phase', 'Initial design');
  const taskA2 = await createOrGetTask(projectA.id, 'Development', 'Coding');
  const taskB1 = await createOrGetTask(projectB.id, 'Research', 'Market research');

  // 4. Assign Members
  // Assign Admin to Project A (as Lead)
  try {
    await membersService.addMember(projectA.id, { userId: adminUser.id, role: ProjectRole.LEAD })
    console.log('Assigned Admin to Project A')
  } catch (e) {}

  // Assign Worker to Project A (as Member)
  try {
    await membersService.addMember(projectA.id, { userId: workerUser.id, role: ProjectRole.MEMBER })
    console.log('Assigned Worker to Project A')
  } catch (e) {}

  // Assign Worker to Project B
  try {
    await membersService.addMember(projectB.id, { userId: workerUser.id, role: ProjectRole.MEMBER })
    console.log('Assigned Worker to Project B')
  } catch (e) {}

  // 5. Log Time (Simulate Worker logging time)
  // We need to switch context to Worker? 
  // TimeEntriesService checks `userId` passed to create().
  // It checks membership.
  // It does NOT check if `currentUser.id === userId` inside `create`. 
  // `UserTimeEntriesController` does `create(user.id, dto)`.
  // `TimeEntriesService.create(userId, dto)` verifies membership using `userId`.
  // So we can use the same service instance (admin context) to create entries for worker, 
  // provided the service doesn't check `currentUserService.get().id === userId`.
  // Let's check `TimeEntriesService.create`.
  // It does NOT use `currentUserService`.
  // It just uses the arguments.
  // So we can seed time entries for the worker.

  try {
      await timeEntriesService.create(workerUser.id, {
          taskId: taskA1.id,
          workDate: new Date().toISOString().split('T')[0],
          minutes: 120,
          notes: 'Worked on design',
      })
      await timeEntriesService.create(workerUser.id, {
          taskId: taskA2.id,
          workDate: new Date().toISOString().split('T')[0],
          minutes: 240,
          notes: 'Worked on dev',
      })
      console.log('Logged initial time for Worker')

      // 6. Seed Bulk Time Entries (200 random entries over 6 months)
      console.log('Seeding 200 random time entries...')
      const tasks = [taskA1, taskA2, taskB1];
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      for (let i = 0; i < 200; i++) {
          const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
          
          // Random date between sixMonthsAgo and now
          const randomDate = new Date(sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime()));
          const workDate = randomDate.toISOString().split('T')[0];
          
          // Random minutes (30 to 480, step 15)
          const randomMinutes = (Math.floor(Math.random() * 30) + 2) * 15; 

          try {
              // We use create directly, hoping no collision on unique constraint (user, task, date).
              // If collision, we catch and ignore.
              await timeEntriesService.create(workerUser.id, {
                  taskId: randomTask.id,
                  workDate,
                  minutes: randomMinutes,
                  notes: `Random entry ${i}`,
              });
          } catch (e) {
              // Ignore duplicates
          }
      }
      console.log('Bulk seeding complete')

  } catch (e) {
      console.error('Failed to log time:', e.message)
  }

  await app.close()
}

bootstrap().catch((error) => {
  console.error('Seeding failed', error)
  process.exit(1)
})
