# Developer Guide

This guide provides comprehensive information for developers working on the Timesheet Management System.

## 🏗 Architecture

The project is a monorepo managed by **Turborepo** (`npm`), consisting of:

*   **`timesheet_backend`**: NestJS (Node.js API) with TypeORM (PostgreSQL).
*   **`admin_app`**: React + Vite + Material UI (Admin Dashboard).
*   **`worker_app`**: React + Vite + Material UI (Worker Timesheet).
*   **`e2e-tests`**: Playwright (End-to-End Tests).

## 🚀 Running the Project

### Prerequisites
*   Node.js v22+
*   Docker & Docker Compose

### Development Environment (Docker)
The easiest way to run the entire stack (Backend, DB, Admin, Worker) in watch mode.

```bash
docker-compose up --build
```

**Services:**
*   **Backend API**: [http://localhost:3000](http://localhost:3000)
*   **Admin App**: [http://localhost:8080](http://localhost:8080)
*   **Worker App**: [http://localhost:8081](http://localhost:8081)
*   **Database**: PostgreSQL on port `5432` (mapped to host).

### Credentials (Seeded)
If you ran the seed script (see below), use these credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password` |
| **Worker** | `worker@example.com` | `password` |

## 🛠 Useful Commands

### 1. Database & Seeding
To populate the database with initial data (Users, Projects, Tasks):

**Running inside Docker (Recommended):**
```bash
docker exec -it $(docker ps -qf "name=backend") npm run seed -w timesheet_backend
```

**Running Locally:**
```bash
npm run seed -w timesheet_backend
```

### 2. Testing

**Backend Unit Tests:**
Runs Jest unit tests for services/controllers.
```bash
npm run test -w timesheet_backend
```

**Backend E2E Tests:**
Runs Jest E2E tests against the backend API (mocks DB or uses test DB).
```bash
npm run test:e2e -w timesheet_backend
```

**Backend Coverage:**
Generates a coverage report combining Unit and E2E tests.
```bash
npm run test:cov -w timesheet_backend
```

**Full System E2E Tests (Playwright):**
Runs browser automation tests against the running Docker stack. Ensure `docker-compose up` is running first.
```bash
npm run test:playwright
```

### 3. Migrations (Teamwork)
To import data from Teamwork:
1.  Create `envs/.teamwork.env` with `TEAMWORK_DOMAIN` and `TEAMWORK_API_KEY`.
2.  Run the migration script:
    ```bash
    npm run migrate:teamwork -w timesheet_backend
    ```

## 📂 Project Structure

```
/
├── admin_app/          # Admin Frontend (React)
├── worker_app/         # Worker Frontend (React)
├── timesheet_backend/  # Backend API (NestJS)
├── e2e-tests/          # Playwright Tests
├── envs/               # Environment variable templates
├── data/               # Local DB persistence (Postgres/SQLite)
├── AGENTS.md           # Coding standards & architectural overview
├── DEVELOP_PLAN_AI.md  # Original requirements & plan
├── PLAN_FOLLOW_UP.md   # Implementation status tracker
└── docker-compose.yml  # Docker orchestration
```

## 📝 Workflow Notes

*   **Hot Reloading (HMR):** All services (Backend, Admin, Worker) run in watch mode inside Docker. Changes to source files on your host machine are reflected immediately.
*   **Database Schema:** TypeORM `synchronize: true` is enabled for development. Schema changes in entities are automatically applied to the DB.
*   **Dependencies:** If you install a new npm package, you must rebuild the containers:
    ```bash
    docker-compose up -d --build
    ```
