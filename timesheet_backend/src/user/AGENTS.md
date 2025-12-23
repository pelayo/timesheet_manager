# User Module

## Purpose
Manages user accounts and their system-level roles (`Admin` or `User`).

## Entities
- **User**:
  - `id`: UUID
  - `email`: Unique
  - `password`: Hashed (in theory, currently plain text in seed for dev)
  - `role`: `admin` | `user`

## Key Components
- **UserService**: CRUD operations. Enforces rules like "Admins can manage Users".
- **AdminUserController**: Endpoints for Admins to manage users (`/admin/users`).
- **UserController**: Endpoints for self-management (`/user/me`).

## Relationships
- **TimeEntry**: One-to-Many (User -> TimeEntries)
- **ProjectMember**: One-to-Many (User -> Memberships)
