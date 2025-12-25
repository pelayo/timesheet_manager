# Timekeeping App — Development Plan (for CLI AI)

## Scope
Build a Teamwork-style timekeeping app:
- Users log time (hours/minutes + date) to tasks under projects.
- Admins manage users, projects, tasks, assignments, close tasks, and report/filter/export time entries.
- Special user view: weekly timesheet grid (projects/tasks as rows, week days as columns).

## Current State (already implemented)
- Monorepo with:
  - Backend: NestJS (PostgreSQL)
  - Frontend Admin: React + Vite + Material UI
  - Frontend User: React + Vite + Material UI
  - E2E Tests: Playwright
- Infrastructure: Docker Compose (Hot Reload)

---

## Core Decisions (must follow)
1. **TimeEntry duration stored as `minutes` (integer)**.
2. **TimeEntry always references a Task** (Project derived from Task).
3. **Closed Task blocks writes**: cannot create/update time entries on CLOSED tasks.
4. **Permissions**
   - ADMIN: full access
   - USER: can only see assigned projects/tasks and only manage their own time entries.
   - **Exception:** Global projects are visible to all users.
5. **Timesheet simplification**
   - Enforce **unique time entry** per `(userId, taskId, workDate)` to allow cell edit semantics.
6. **Task Visibility (Worker View)**
   - Workers see tasks they have logged time against in the current week.
   - Workers can explicitly "Pin" tasks to their view using an "Add Task" dialog.
   - Workers can "Remove" (Unpin) tasks from their view if no hours are logged for the current week.

---

## Data Model (DB schema)

### Tables
- `projects`
  - `id` (uuid)
  - `name` (string, required)
  - `code` (string, optional)
  - `description` (text, optional)
  - `isArchived` (bool, default false)
  - `isGlobal` (bool, default false) **[NEW]**
  - `createdAt`, `updatedAt`

- `tasks`
  - `id` (uuid)
  - `projectId` (uuid, FK -> projects)
  - `name` (string, required)
  - `description` (text, optional)
  - `status` (enum OPEN|CLOSED, default OPEN)
  - `closedAt` (timestamp, optional)
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

- `user_pinned_tasks` **[NEW]**
  - `userId` (uuid, FK -> users)
  - `taskId` (uuid, FK -> tasks)
  - `createdAt`
  - PK: `(userId, taskId)`

### Integrity Rules
- `minutes > 0`
- Writes to `time_entries` must verify:
  - User is project member of the task’s project **OR** Project is Global.
  - Task status is OPEN.

---

## Backend Architecture (NestJS)
Create modules:
- `projects`
- `tasks`
- `assignments` (project_members)
- `time-entries` (includes Pinned Tasks logic)
- `reporting`

Use:
- DTOs + `class-validator`
- RBAC via `RolesGuard` and `@Roles(ADMIN|USER)`
- Separate route namespaces:
  - `/admin/*` for admin operations
  - `/me/*` for user self operations

---

## Phase 0 — Foundations (Backend)
- [x] RBAC (`RolesGuard`, `@Roles`)
- [x] Database Schema & Migrations (TypeORM Sync used for dev/prototype)
- [x] Standardized Modules (`projects`, `tasks`, `users`, etc.)
- [x] Seed Script

## Phase 1 — Projects (Admin + User)
- [x] Backend: Admin CRUD Endpoints
- [x] Backend: User "My Projects" Endpoint (Includes Global Projects)
- [x] Admin UI: Projects List & Create (Support `isGlobal` flag)
- [x] Admin UI: Edit/Archive Project

## Phase 2 — Tasks (Admin + User)
- [x] Backend: Task CRUD
- [x] Backend: Close/Reopen Logic
- [x] Admin UI: Project Detail -> Tasks Tab
- [x] Admin UI: Add/Edit/Close Tasks

## Phase 3 — Assign Users to Projects (Admin)
- [x] Backend: Project Members API
- [x] Admin UI: Project Detail -> Members Tab
- [x] Admin UI: Assign/Remove Users

## Phase 4 — Time Entries (User CRUD + Admin Read)
- [x] Backend: Time Entry CRUD (Auto-pins task on create)
- [x] Validation Rules (Closed Task, Membership/Global Check)
- [x] Admin Read-Only Endpoints (Pagination Supported)
- [x] Admin UI: Time Entries Page (Table with Filters & Pagination)

## Phase 5 — Timesheet Weekly Grid (User)
- [x] Backend: `getWeeklyTimesheet` endpoint (Returns Entries + Pinned Tasks)
- [x] Backend: Cell update logic (upsert/delete)
- [x] Backend: Pin/Unpin Endpoints
- [x] User UI: Weekly Grid Component
- [x] User UI: Date Navigation & Totals
- [x] User UI: "Add Task" Dialog (Pin Task)
- [x] User UI: "Remove" Row Button (Unpin Task)

## Phase 6 — Reporting & Export (Admin)
- [x] Backend: Report Endpoint with Filters
- [x] Backend: CSV Export Endpoint
- [x] Admin UI: Reports Page with Filters & Export Button

## Phase 7 — Hardening & Quality
- [x] Unit Tests (Service Layer)
- [x] E2E Tests (Backend APIs)
- [x] Playwright Tests (Full System E2E)
- [x] Coverage Reporting (~73%)
- [x] Docker Support (Dev Watch Mode, Postgres)
- [x] Migration Script (Teamwork API with Rate Limiting)

---

## Optional Backlog (post-MVP)
- Timesheet submit/approve workflow.
- Task-level assignments (if needed).
- Budgets and alerts per project.
- Multi-tenant support.
- Import/export projects/tasks (Native JSON format).