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
  const taskA1 = await tasksService.create(projectA.id, { name: 'Design Phase', description: 'Initial design' })
  const taskA2 = await tasksService.create(projectA.id, { name: 'Development', description: 'Coding' })
  const taskB1 = await tasksService.create(projectB.id, { name: 'Research', description: 'Market research' })
  console.log('Created Tasks')

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
      console.log('Logged time for Worker')
  } catch (e) {
      console.error('Failed to log time:', e.message)
  }

  await app.close()
}

bootstrap().catch((error) => {
  console.error('Seeding failed', error)
  process.exit(1)
})
