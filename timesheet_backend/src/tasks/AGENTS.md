# Tasks Module

## Purpose
Manages Tasks within Projects. Time is logged against Tasks.

## Entities
- **Task**:
  - `id`: UUID
  - `projectId`: FK to Project
  - `name`: String
  - `status`: `OPEN` | `CLOSED`
  - `closedAt`: Timestamp

## Key Components
- **TasksService**:
  - Standard CRUD.
  - `close(id)` / `reopen(id)`: Changes status.
  - **Rule**: Closing a task prevents new time entries (enforced in `time-entries` module).
- **AdminTasksController**: Manage tasks (`/admin/projects/:id/tasks`).
- **UserProjectsController** (in Projects module) uses `TasksService` to list tasks for a project.

## Relationships
- **Project**: Many-to-One
- **TimeEntry**: One-to-Many (Task -> TimeEntries)
