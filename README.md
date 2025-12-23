# Timesheet Management System

A full-stack monorepo application for managing employee timesheets, projects, and tasks.

## 🏗 Architecture

This project is a monorepo managed by **Turborepo**, consisting of:

- **`timesheet_backend`**: A [NestJS](https://nestjs.com/) API server handling business logic, authentication, and database interactions (SQLite).
- **`admin_app`**: A [React](https://react.dev/) + [Vite](https://vitejs.dev/) application for Administrators to manage users, projects, and view reports.
- **`worker_app`**: A [React](https://react.dev/) + [Vite](https://vitejs.dev/) application for Employees (Workers) to log their daily work hours.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- npm (v10+)

### Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   The backend uses `.env` for configuration. A seed script handles initial data.
   ```bash
   # (Optional) Check timesheet_backend/.env
   ```

3. **Seed Database**:
   Populate the database with initial Admin/Worker users and sample Projects.
   ```bash
   npm run seed -w timesheet_backend
   ```

4. **Run Development Server**:
   Starts all applications (Backend, Admin App, Worker App) in parallel.
   ```bash
   npm run dev
   ```

## 🧪 Testing

- **Unit Tests**:
  ```bash
  npm run test -w timesheet_backend
  ```
- **E2E Tests**:
  ```bash
  npm run test:e2e -w timesheet_backend
  ```
- **Coverage**:
  ```bash
  npm run test:cov -w timesheet_backend
  ```

## 📦 Core Entities

- **User**: System users with roles (`Admin` or `User`).
- **Project**: Top-level containers for work.
- **Task**: Specific deliverables within a Project. Time is logged here.
- **ProjectMember**: Assignments of Users to Projects.
- **TimeEntry**: A record of minutes worked by a User on a Task for a specific Date.

## 🔄 Workflows

### Administrator
1.  **User Management**: Create and manage `Admin` and `User` accounts.
2.  **Project Setup**: Create Projects and Tasks.
3.  **Assignments**: Assign Users to Projects to allow them to log time.
4.  **Reporting**: View aggregate time reports and export to CSV.

### Worker
1.  **Log Time**: Select a Project/Task and log minutes for a date.
2.  **Weekly Grid**: View and edit time entries in a weekly timesheet grid.

## 📚 Detailed Documentation

For deep dives into the backend modules and implementation details, refer to the following guides:

- **[Authentication & Security](timesheet_backend/src/auth/AGENTS.md)**: JWT strategy and RBAC.
- **[User Management](timesheet_backend/src/user/AGENTS.md)**: User entity and logic.
- **[Projects](timesheet_backend/src/projects/AGENTS.md)**: Project hierarchy and lookups.
- **[Tasks](timesheet_backend/src/tasks/AGENTS.md)**: Task lifecycle (Open/Closed).
- **[Assignments (Members)](timesheet_backend/src/project-members/AGENTS.md)**: Project membership logic.
- **[Time Entries](timesheet_backend/src/time-entries/AGENTS.md)**: Time logging and validation rules.
- **[Reporting](timesheet_backend/src/reporting/AGENTS.md)**: Reporting engine and CSV export.