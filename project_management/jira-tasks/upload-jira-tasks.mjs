import { readFile } from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)
const envDryRun = process.env.JIRA_DRY_RUN
const dryRun =
  args.includes('--dry-run') ||
  envDryRun === 'true' ||
  envDryRun === '1' ||
  envDryRun === 'yes'
const tasksArg = args.find((arg) => !arg.startsWith('--'))

const tasksPath = tasksArg
  ? path.resolve(process.cwd(), tasksArg)
  : new URL('./tasks.json', import.meta.url)

const baseUrl = process.env.JIRA_BASE_URL
const projectKey = process.env.JIRA_PROJECT_KEY
const token = process.env.JIRA_API_TOKEN
const email = process.env.JIRA_EMAIL
const issueType = process.env.JIRA_ISSUE_TYPE || 'Story'
const apiVersion = process.env.JIRA_API_VERSION || '2'
const labels = process.env.JIRA_LABELS
  ? process.env.JIRA_LABELS.split(',').map((label) => label.trim()).filter(Boolean)
  : []

const authHeader = email && token
  ? `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`
  : token
    ? `Bearer ${token}`
    : null

const endpoint = baseUrl
  ? `${baseUrl.replace(/\/$/, '')}/rest/api/${apiVersion}/issue`
  : null

const rawTasks = await readFile(tasksPath, 'utf8')
const tasks = JSON.parse(rawTasks)

if (!Array.isArray(tasks) || tasks.length === 0) {
  console.error('No tasks found. Expected a non-empty JSON array with title/description fields.')
  process.exit(1)
}

if (!dryRun && (!baseUrl || !projectKey || !token)) {
  console.error('Missing required env vars: JIRA_BASE_URL, JIRA_PROJECT_KEY, JIRA_API_TOKEN')
  process.exit(1)
}

if (!dryRun && typeof fetch !== 'function') {
  console.error('Global fetch is not available. Use Node 18+ or provide a fetch polyfill.')
  process.exit(1)
}

const toAdf = (text) => {
  const lines = text.split(/\r?\n/)
  return {
    type: 'doc',
    version: 1,
    content: lines.map((line) => ({
      type: 'paragraph',
      content: line
        ? [{ type: 'text', text: line }]
        : [{ type: 'text', text: ' ' }]
    }))
  }
}

const normalizeLabels = (taskLabels) => {
  if (!taskLabels) {
    return labels
  }
  if (Array.isArray(taskLabels)) {
    return taskLabels.map((label) => String(label).trim()).filter(Boolean)
  }
  return String(taskLabels)
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
}

const createIssue = async (task) => {
  const resolvedIssueType = task.issueType || issueType
  const resolvedLabels = normalizeLabels(task.labels)
  const fields = {
    project: { key: projectKey },
    summary: task.title,
    issuetype: { name: resolvedIssueType }
  }

  if (resolvedLabels.length > 0) {
    fields.labels = resolvedLabels
  }

  fields.description = apiVersion === '3' ? toAdf(task.description) : task.description

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify({ fields })
  })

  const responseBody = await response.text()

  if (!response.ok) {
    throw new Error(`Jira error ${response.status}: ${responseBody}`)
  }

  return responseBody
}

for (const task of tasks) {
  if (!task?.title || !task?.description) {
    console.warn('Skipping task with missing title or description', task)
    continue
  }

  if (dryRun) {
    console.log(`[dry-run] Would create: ${task.title}`)
    continue
  }

  try {
    const result = await createIssue(task)
    console.log(`Created: ${task.title} -> ${result}`)
  } catch (error) {
    console.error(`Failed: ${task.title}`)
    console.error(error?.message || error)
  }
}
