# Project Members Module

## Purpose
Manages the many-to-many relationship between Users and Projects (Assignments).

## Entities
- **ProjectMember**:
  - `projectId`: FK
  - `userId`: FK
  - `role`: `MEMBER` | `LEAD` (Project-level role, distinct from System role)
  - PK: Composite `(projectId, userId)`

## Key Components
- **ProjectMembersService**: Add/Remove members.
- **AdminProjectMembersController**: API for Admins to assign users (`/admin/projects/:id/members`).

## Logic
- Membership grants **Read** access to the Project and its Tasks.
- Membership grants **Write** permission to log time against the Project's Tasks.
