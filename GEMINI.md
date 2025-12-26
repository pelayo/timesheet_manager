# GEMINI.md: Project Context

This file provides a comprehensive overview of the Timesheet monorepo for AI-driven development.

## Project Overview

This is a full-stack, multi-package monorepo for a timekeeping application, managed with `npm` workspaces and `Turborepo`. The stack consists of a NestJS backend, two React frontends (for admins and workers), and a Playwright test suite. The entire environment is containerized with Docker for consistent development and deployment.

### Core Components:

*   **`timesheet_backend`**: A **NestJS** application serving as the API. It handles business logic, authentication (JWT), and data persistence via TypeORM with a PostgreSQL database. It exposes a RESTful API for managing users, projects, tasks, and time entries.
*   **`admin_app`**: A **React (Vite + TypeScript)** single-page application for administrators. It provides a UI for managing users, projects, tasks, project assignments, and viewing aggregated reports and statistics. It uses Material UI for components.
*   **`worker_app`**: A **React (Vite + TypeScript)** single-page application for employees/workers. Its primary feature is a weekly timesheet grid that allows users to log time against their assigned projects and tasks.
*   **`e2e-tests`**: A **Playwright** suite for end-to-end testing of the applications.
*   **`docker-compose.yml`**: Defines the services for development, including the database (`postgres`), backend, and the two frontend applications, all connected on a shared network.

## Building and Running

The project is designed to be run within Docker containers, which handles the setup of all services.

### Key Commands (from root):

*   **Start All Services (Development):**
    This is the primary command for development. It builds the Docker images (if they don't exist) and starts all services in watch mode with hot-reloading.
    ```bash
    docker compose up -d --build
    ```
    *   Admin App: `http://localhost:8080`
    *   Worker App: `http://localhost:8081`
    *   Backend API: `http://localhost:3000`

*   **Stop All Services:**
    ```bash
    docker compose down
    ```

*   **Run a command within a workspace (via Turbo):**
    For example, to run tests on the backend:
    ```bash
    npm run test -w timesheet_backend
    ```

*   **Install Dependencies:**
    (Shouldn't be needed often if using Docker, but required for local setup).
    ```bash
    npm install
    ```

## Development Conventions

*   **Monorepo Structure**: Code is organized into independent packages (`admin_app`, `worker_app`, `timesheet_backend`) within the `workspaces` array in the root `package.json`. `Turborepo` is used to manage tasks and dependencies between these packages.
*   **API-Driven**: The frontends are completely decoupled from the backend and communicate solely through the REST API. The API endpoint is configured via the `VITE_API_URL` environment variable in the frontend Docker services.
*   **Database**: A PostgreSQL database is used, managed by the `db` service in `docker-compose.yml`. Data is persisted in a Docker volume. An initialization script in `postgres-init/init.sql` sets up the initial schema.
*   **Authentication**: The backend uses JWT-based authentication. The `admin` and `worker` frontends handle token storage and renewal.
*   **Styling**: The frontend applications use **Material UI (MUI)** for UI components.
*   **State Management (Frontend)**: The frontends utilize **TanStack Query (React Query)** for server-state management, caching, and data fetching.
*   **Testing**:
    *   Backend unit and integration tests are written with **Jest** and can be found in the `timesheet_backend/src` and `timesheet_backend/test` directories.
    *   End-to-end tests are written with **Playwright** and are located in the `e2e-tests` directory.
