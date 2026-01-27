import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectDir = path.resolve(__dirname, '..')

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return
  const raw = fs.readFileSync(filepath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim().replace(/^export\s+/, '')
    let value = trimmed.slice(idx + 1).trim()
    if (!value.startsWith('"') && !value.startsWith("'")) {
      const hashIdx = value.indexOf('#')
      if (hashIdx !== -1) value = value.slice(0, hashIdx).trim()
    }
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(path.join(projectDir, '.env.agent'))

const baseUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL
const email = process.env.JIRA_EMAIL
const apiToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN
const boardId = process.env.JIRA_PANEL_ID || '1253'

if (!baseUrl || !email || !apiToken) {
  console.error('Missing Jira config. Ensure `.env.agent` has JIRA_URL, JIRA_EMAIL, JIRA_TOKEN.')
  process.exit(1)
}

function authHeader() {
  const token = Buffer.from(`${email}:${apiToken}`).toString('base64')
  return `Basic ${token}`
}

async function jiraRequest(urlPath) {
  const url = new URL(urlPath, baseUrl)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json'
    }
  })

  const text = await response.text()
  const json = text ? safeJsonParse(text) : null

  if (!response.ok) {
    const message = json?.errorMessages?.[0] || json?.message || text || `Jira error ${response.status}`
    throw new Error(`${message} (HTTP ${response.status} ${url.pathname})`)
  }

  return json
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function statusCategoryName(status) {
  const key = status?.statusCategory?.key
  if (typeof key === 'string' && key) return key
  const name = status?.statusCategory?.name
  if (typeof name === 'string' && name) return name
  return 'unknown'
}

async function loadAllStatusesById() {
  const statuses = await jiraRequest('/rest/api/3/status')
  const list = Array.isArray(statuses) ? statuses : []
  const byId = new Map()
  for (const status of list) {
    const id = status?.id
    if (typeof id !== 'string' && typeof id !== 'number') continue
    byId.set(String(id), status)
  }
  return byId
}

async function main() {
  const config = await jiraRequest(`/rest/agile/1.0/board/${encodeURIComponent(boardId)}/configuration`)
  const statusById = await loadAllStatusesById()

  const boardName = config?.name || `board ${boardId}`
  const columns = Array.isArray(config?.columnConfig?.columns) ? config.columnConfig.columns : []

  console.log(`Board: ${boardName} (id=${boardId})`)
  console.log('')
  console.log('Columns / Statuses:')

  for (const column of columns) {
    const colName = column?.name || '(unnamed)'
    const statuses = Array.isArray(column?.statuses) ? column.statuses : []
    const statusNames = statuses
      .map((s) => {
        const rawId = s?.id
        const status = rawId ? statusById.get(String(rawId)) : s
        const name = status?.name || rawId || 'Unknown'
        const cat = statusCategoryName(status)
        const id = status?.id || rawId || ''
        return `${name} (id=${id}) [${cat}]`
      })
      .join(', ')
    console.log(`- ${colName}: ${statusNames || '(no statuses?)'}`)
  }

  console.log('')
  console.log('Suggested env values (pick ONE status name that exists in your board):')
  console.log('- JIRA_DOING_STATUS=<one of the statuses under your Doing/In Progress column>')
  console.log('- JIRA_DONE_STATUS=<one of the statuses under your Done column>')
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
