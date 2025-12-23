# Projects Module

## Purpose
Manages Projects, which are the top-level containers for Tasks and Assignments.

## Entities
- **Project**:
  - `id`: UUID
  - `name`: String
  - `code`: Optional code
  - `isArchived`: Boolean

## Key Components
- **ProjectsService**:
  - `create`, `update`, `findAll`.
  - `findForUser(userId)`: Returns projects where the user is a member.
- **AdminProjectsController**: CRUD for Admins (`/admin/projects`).
- **UserProjectsController**: Read-only for Users (`/me/projects`), filtered by membership.

## Relationships
- **Task**: One-to-Many (Project -> Tasks)
- **ProjectMember**: One-to-Many (Project -> Members)
