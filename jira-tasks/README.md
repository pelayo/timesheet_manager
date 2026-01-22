# Jira Tasks

This folder contains the Jira task list and a helper script to upload them to a Jira project.

## Files

- tasks.json: Task definitions (title + description)
- upload-jira-tasks.mjs: Script to create issues in Jira

## Usage

Set the environment variables and run the script:

```bash
JIRA_BASE_URL="https://your-domain.atlassian.net" \
JIRA_PROJECT_KEY="PROJ" \
JIRA_API_TOKEN="your-token" \
JIRA_EMAIL="you@example.com" \
node jira-tasks/upload-jira-tasks.mjs jira-tasks/tasks.json
```

If your Jira instance accepts bearer tokens instead of basic auth, omit JIRA_EMAIL.

Optional environment variables:

- JIRA_ISSUE_TYPE: Default is Task
- JIRA_LABELS: Comma-separated labels to apply
- JIRA_API_VERSION: Default is 2 (use 3 if needed)
- JIRA_DRY_RUN: true or 1 to avoid creating issues

Dry run example:

```bash
JIRA_BASE_URL="https://your-domain.atlassian.net" \
JIRA_PROJECT_KEY="PROJ" \
JIRA_API_TOKEN="your-token" \
JIRA_EMAIL="you@example.com" \
JIRA_DRY_RUN=1 \
node jira-tasks/upload-jira-tasks.mjs jira-tasks/tasks.json --dry-run
```
