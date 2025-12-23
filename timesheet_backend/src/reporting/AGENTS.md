# Reporting Module

## Purpose
Provides aggregate reports and data export functionality for Admins.

## Key Components
- **ReportingService**:
  - `getReport(filter)`: Dynamic querying with filters (date range, user, project, task) and grouping.
  - `exportCsv(filter)`: Streams/Generates a CSV of flattened time entry data.
- **ReportingController**: Exposes endpoints at `/admin/reports`.

## Features
- **Filters**: `from`, `to`, `userId`, `projectId`, `taskId`.
- **Grouping**: By `user`, `project`, `task`, or `day` (for API response).
- **CSV Format**: Includes calculated `hoursDecimal` and flattening of related entities.
