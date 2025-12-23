# Time Entries Module

## Purpose
The core module for logging work hours (in minutes) and managing the Weekly Timesheet.

## Entities
- **TimeEntry**:
  - `id`: UUID
  - `userId`: FK
  - `taskId`: FK
  - `workDate`: Date (YYYY-MM-DD)
  - `minutes`: Integer (> 0)
  - **Unique Constraint**: `(userId, taskId, workDate)` - One entry per task per day per user.

## Key Components
- **TimeEntriesService**:
  - `create/update`: Validates that:
    1. User is a member of the project.
    2. Task is `OPEN`.
    3. Minutes > 0.
  - `getWeeklyTimesheet(userId, weekStart)`: Aggregates entries into a grid view (Rows: Tasks, Cols: Days).
  - `updateTimesheetCell`: Upsert logic (0 minutes = delete).
- **TimesheetController**: User-facing grid endpoints (`/me/timesheet`).
- **UserTimeEntriesController**: List/Create endpoints.
- **AdminTimeEntriesController**: Read-only access for Admins to view all entries.

## Relationships
- **User**: Many-to-One
- **Task**: Many-to-One
