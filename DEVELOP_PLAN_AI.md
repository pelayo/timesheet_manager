# Timekeeping App — Development Plan (for CLI AI)

## Scope
Build a Teamwork-style timekeeping app:
- Users log time (hours/minutes + date) to tasks under projects.
- Admins manage users, projects, tasks, assignments, close tasks, and report/filter/export time entries.
- Special user view: weekly timesheet grid (projects/tasks as rows, week days as columns).

## Current State (already implemented)
- Monorepo with:
  - Backend: NestJS
  - Frontend Admin
  - Frontend User
- Authentication implemented
- Admin: CRUD Users implemented

---

## Core Decisions (must follow)
1. **TimeEntry duration stored as `minutes` (integer)**.
2. **TimeEntry always references a Task** (Project derived from Task).
3. **Closed Task blocks writes**: cannot create/update time entries on CLOSED tasks.
4. **Permissions**
   - ADMIN: full access
   - USER: can only see assigned projects/tasks and only manage their own time entries
5. **Timesheet simplification**
   - Enforce **unique time entry** per `(userId, taskId, workDate)` to allow cell edit semantics.

---

## Data Model (DB schema)

### Tables
- `projects`
  - `id` (uuid)
  - `name` (string, required)
  - `code` (string, optional)
  - `description` (text, optional)
  - `isArchived` (bool, default false)
  - `createdAt`, `updatedAt`

- `tasks`
  - `id` (uuid)
  - `projectId` (uuid, FK -> projects)
  - `name` (string, required)
  - `description` (text, optional)
  - `status` (enum OPEN|CLOSED, default OPEN)
  - `closedAt` (datetime, optional)
  - `createdAt`, `updatedAt`

- `project_members`
  - `projectId` (uuid, FK -> projects)
  - `userId` (uuid, FK -> users)
  - `role` (enum MEMBER|LEAD, optional)
  - `createdAt`
  - PK: `(projectId, userId)`

- `time_entries`
  - `id` (uuid)
  - `userId` (uuid, FK -> users)
  - `taskId` (uuid, FK -> tasks)
  - `workDate` (date, required)
  - `minutes` (int, required, > 0)
  - `notes` (text, optional)
  - `createdAt`, `updatedAt`
  - Unique: `(userId, taskId, workDate)`

### Indexes
- `time_entries(userId, workDate)`
- `time_entries(taskId, workDate)`
- `tasks(projectId, status)`

### Integrity Rules
- `minutes > 0`
- Writes to `time_entries` must verify:
  - user is project member of the task’s project
  - task status is OPEN

---

## Backend Architecture (NestJS)
Create modules:
- `projects`
- `tasks`
- `assignments` (project_members)
- `time-entries`
- `reporting`

Use:
- DTOs + `class-validator`
- RBAC via `RolesGuard` and `@Roles(ADMIN|USER)`
- Separate route namespaces:
  - `/admin/*` for admin operations
  - `/me/*` for user self operations

---

## Phase 0 — Foundations (Backend)
### Tasks
- Add RBAC if missing:
  - roles: `ADMIN`, `USER`
  - `RolesGuard`, `@Roles()`
- Add modules skeletons listed above
- Implement DB migrations for schema
- Add standardized error codes:
  - `TASK_CLOSED`
  - `NOT_ASSIGNED`
  - `NOT_OWNER`
  - `VALIDATION_ERROR`

### Acceptance Criteria
- Migrations apply
- Guards enforce role access
- Basic module wiring compiles and runs

---

## Phase 1 — Projects (Admin + User)
### Backend Endpoints
Admin:
- `POST /admin/projects`
- `GET /admin/projects?search=&archived=`
- `GET /admin/projects/:id`
- `PATCH /admin/projects/:id` (edit + archive)
- Prefer archive over delete

User:
- `GET /me/projects` (only where member)

### Admin UI
- Projects list + search
- Create project
- Project detail/edit/archive

### User UI
- "My Projects" list

### Acceptance Criteria
- Admin can create/edit/archive projects
- User only sees assigned projects

---

## Phase 2 — Tasks (Admin + User)
### Backend Endpoints
Admin:
- `POST /admin/projects/:projectId/tasks`
- `GET /admin/projects/:projectId/tasks?status=`
- `PATCH /admin/tasks/:taskId`
- `POST /admin/tasks/:taskId/close`
- `POST /admin/tasks/:taskId/reopen` (optional)

User:
- `GET /me/projects/:projectId/tasks` (only if member)

### Rules
- Closing a task sets `status=CLOSED` and `closedAt=now`
- No writes to time entries for CLOSED tasks

### Admin UI
- Project detail: tasks list + create task
- Close/reopen buttons

### User UI
- Project -> tasks list (read-only, shows OPEN/CLOSED)

### Acceptance Criteria
- Closing task blocks time logging immediately

---

## Phase 3 — Assign Users to Projects (Admin)
### Backend Endpoints
- `POST /admin/projects/:projectId/members` body `{ userId, role? }`
- `GET /admin/projects/:projectId/members`
- `DELETE /admin/projects/:projectId/members/:userId`

### Rules
- Membership controls visibility and logging permissions
- Removing membership does not delete historical time entries

### Admin UI
- Project detail: members tab
- Search user + assign
- Remove member

### Acceptance Criteria
- Non-member cannot see project/tasks nor log time to them

---

## Phase 4 — Time Entries (User CRUD + Admin Read)
### Backend Endpoints (User)
- `POST /me/time-entries` body `{ taskId, workDate, minutes, notes? }`
- `GET /me/time-entries?from=&to=&projectId=&taskId=`
- `PATCH /me/time-entries/:id` (own only)
- `DELETE /me/time-entries/:id` (own only)

### Backend Endpoints (Admin)
- `GET /admin/time-entries?from=&to=&userId=&projectId=&taskId=`
- `GET /admin/time-entries/:id`

### Validation
- `workDate` is a date (no time)
- `minutes` int > 0 and <= 1440

### User UI
- Simple "Log time" flow:
  - select project -> task -> date -> minutes -> save
- Personal time entries list with filters

### Acceptance Criteria
- User can CRUD own time entries within permissions
- Admin can query entries with filters

---

## Phase 5 — Timesheet Weekly Grid (User)
### Backend Endpoints
1) Load weekly timesheet:
- `GET /me/timesheet?weekStart=YYYY-MM-DD`
Response shape:
- `weekStart`
- `days: [YYYY-MM-DD x7]`
- `rows: [{ projectId, projectName, taskId, taskName, isClosed, minutesByDay: { [date]: minutes } }]`
- `totalsByDay: { [date]: minutes }`
- `totalWeek: minutes`

2) Edit a single cell:
- `PUT /me/timesheet/cell` body `{ taskId, workDate, minutes }`
Semantics:
- if entry exists for `(user, taskId, workDate)` -> update
- if minutes == 0 -> delete entry (if exists)
- if no entry and minutes > 0 -> create
Rules:
- reject if task CLOSED
- reject if user not member

3) Optional bulk update:
- `PUT /me/timesheet/bulk` body `{ weekStart, changes: [{ taskId, workDate, minutes }] }`

### User UI
- Week selector
- Grid with editable numeric cells
- Group rows by project
- Totals per day and total week
- Closed tasks appear read-only

### Acceptance Criteria
- 1 request loads entire week
- Cell edits persist and update totals
- Closed tasks reject edits with clear error

---

## Phase 6 — Reporting & Export (Admin)
### Backend Endpoints
- `GET /admin/reports/time-entries?from=&to=&userId=&projectId=&taskId=&groupBy=user|project|task|day`
- `GET /admin/reports/time-entries/export?from=&to=&userId=&projectId=&taskId=&format=csv`

CSV columns:
- `date`
- `userId`
- `userEmail`
- `projectId`
- `projectName`
- `taskId`
- `taskName`
- `minutes`
- `hoursDecimal` (optional derived)
- `notes`

Implementation notes:
- stream CSV output (avoid loading all rows)
- pagination for UI list endpoints

### Admin UI
- Reports page with:
  - date range picker
  - filters: user/project/task
  - paginated table
  - export CSV button

### Acceptance Criteria
- Export matches filters and is downloadable
- Reporting endpoint supports grouping

---

## Phase 7 — Hardening & Quality
### Tasks
- Standardize API errors and UI handling
- Add seed data for dev
- Add tests:
  - Unit: permissions, task closed, timesheet unique constraint logic
  - E2E: happy paths (timesheet load/edit, admin report/export)
- Observability:
  - structured logs for key actions (create entry, close task, export)

### Acceptance Criteria
- Core flows covered by tests
- No regression on auth/user CRUD

---

## Optional Backlog (post-MVP)
- Timesheet submit/approve weekly and lock
- Task-level assignments (if needed)
- Budgets and alerts per project
- Multi-tenant support
- Import/export projects/tasks

