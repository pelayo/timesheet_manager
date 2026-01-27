import { spawnSync } from 'node:child_process'
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
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(projectDir, '.env.agent'))

const projectKey = process.env.JIRA_PROJECT_KEY || 'CT'
const todoStatus = process.env.JIRA_TODO_STATUS || ''
const defaultJql = todoStatus
  ? `project=${projectKey} AND status="${todoStatus}" AND assignee=currentUser() ORDER BY created DESC`
  : `project=${projectKey} AND statusCategory=ToDo AND assignee=currentUser() ORDER BY created DESC`

const config = {
  baseUrl: process.env.JIRA_URL || process.env.JIRA_BASE_URL,
  email: process.env.JIRA_EMAIL,
  apiToken: process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN,
  projectKey,
  jql: process.env.JIRA_JQL || defaultJql,
  issueKey: process.env.JIRA_ISSUE_KEY || '',
  doingStatus: process.env.JIRA_DOING_STATUS || 'Doing',
  doneStatus: process.env.JIRA_DEVELOP_STATUS || process.env.JIRA_DONE_STATUS || 'Done',
  dryRun: (process.env.DRY_RUN || '1') === '1',
  runCodex: (process.env.RUN_CODEX || '0') === '1',
  autoDone: (process.env.AUTO_DONE || '0') === '1',
  codexBin: process.env.CODEX_BIN || 'codex',
  createPr: (process.env.CREATE_PR || '0') === '1',
  gitBaseBranch: process.env.GIT_BASE_BRANCH || 'main',
  githubToken: process.env.GITHUB_TOKEN || '',
  codexAskForApproval: process.env.CODEX_ASK_FOR_APPROVAL || 'untrusted',
  prProvider: (process.env.PR_PROVIDER || '').toLowerCase(),
  ghBin: process.env.GH_BIN || 'gh'
}

if (!config.baseUrl || !config.email || !config.apiToken) {
  console.error('Missing Jira config. Ensure `.env.agent` has JIRA_URL, JIRA_EMAIL, JIRA_TOKEN.')
  process.exit(1)
}

function authHeader() {
  const token = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')
  return `Basic ${token}`
}

function runGit(args, { allowFailure } = {}) {
  const result = spawnSync('git', args, { cwd: projectDir, encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0 && !allowFailure) {
    const stderr = (result.stderr || '').trim()
    throw new Error(stderr || `git ${args.join(' ')} failed`)
  }
  return {
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    status: result.status ?? 0
  }
}

function ensureCleanWorkingTree() {
  const { stdout } = runGit(['status', '--porcelain'])
  if (stdout) {
    throw new Error('Working tree is not clean. Commit/stash changes before running the agent.')
  }
}

function ensureBaseUpToDate() {
  runGit(['fetch', 'origin', config.gitBaseBranch])

  const hasLocalBase =
    runGit(['show-ref', '--verify', '--quiet', `refs/heads/${config.gitBaseBranch}`], {
      allowFailure: true
    }).status === 0

  if (!hasLocalBase) {
    runGit(['checkout', '-b', config.gitBaseBranch, '--track', `origin/${config.gitBaseBranch}`])
  } else {
    runGit(['checkout', config.gitBaseBranch])
    runGit(['pull', '--ff-only', 'origin', config.gitBaseBranch])
  }
}

function branchExists(branchName) {
  const result = runGit(['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`], {
    allowFailure: true
  })
  return result.status === 0
}

function slugify(value, maxLen = 40) {
  const cleaned = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned.slice(0, maxLen) || 'task'
}

async function jiraRequest(method, urlPath, { query, body } = {}) {
  const url = new URL(urlPath, config.baseUrl)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value))
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const text = await response.text()
  const json = text ? safeJsonParse(text) : null

  if (!response.ok) {
    const message = json?.errorMessages?.[0] || json?.message || text || `Jira error ${response.status}`
    throw new Error(message)
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

function adfToText(node) {
  if (!node || typeof node !== 'object') return ''
  if (node.type === 'text') return String(node.text || '')

  const content = Array.isArray(node.content) ? node.content : []
  const parts = content.map(adfToText).filter(Boolean)

  switch (node.type) {
    case 'paragraph':
      return parts.join('') + '\n'
    case 'heading':
      return parts.join('') + '\n'
    case 'bulletList':
    case 'orderedList':
      return parts.join('') + '\n'
    case 'listItem':
      return '- ' + parts.join('').trim() + '\n'
    case 'doc':
      return parts.join('').trim()
    default:
      return parts.join('')
  }
}

function buildCodexPrompt(issue) {
  const summary = issue.fields?.summary || issue.key
  const descriptionText = adfToText(issue.fields?.description)

  return [
    'Tarea desde Jira:',
    `- Key: ${issue.key}`,
    `- Summary: ${summary}`,
    '',
    'Descripción (texto plano):',
    descriptionText || '(sin descripción)',
    '',
    'Repositorio objetivo: este proyecto Symfony+React en `symfonyreact/`.',
    'Restricciones:',
    '- No usar base de datos: persistencia en `var/data/shopping-list.json`.',
    '- Mantener el frontend simple (React CDN en `public/app.js`).',
    '',
    'Objetivo:',
    '1) Implementa la tarea de Jira con cambios mínimos.',
    '2) Verifica manualmente (si aplica) y deja instrucciones claras.',
    '',
    'Cuando termines, resume qué ficheros tocaste y por qué.'
  ].join('\n')
}

async function getIssue(issueKey) {
  return jiraRequest('GET', `/rest/api/3/issue/${encodeURIComponent(issueKey)}`, {
    query: {
      fields: 'summary,description,status,labels,assignee'
    }
  })
}

async function listTodoIssues() {
  let data
  try {
    data = await jiraRequest('GET', '/rest/api/3/search/jql', {
      query: {
        jql: config.jql,
        maxResults: 5,
        fields: 'summary,description,status,labels,assignee'
      }
    })
  } catch (error) {
    data = await jiraRequest('GET', '/rest/api/3/search', {
      query: {
        jql: config.jql,
        maxResults: 5,
        fields: 'summary,description,status,labels,assignee'
      }
    })
  }

  const issues = Array.isArray(data?.issues) ? data.issues : []
  return issues
}

async function findTransitionId(issueKey, targetStatusName) {
  const data = await jiraRequest('GET', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`)
  const transitions = Array.isArray(data?.transitions) ? data.transitions : []

  const target = targetStatusName.toLowerCase()
  const match = transitions.find((t) => {
    const name = String(t?.name || '').toLowerCase()
    const toName = String(t?.to?.name || '').toLowerCase()
    return name === target || toName === target
  })

  return match?.id || null
}

async function transitionIssue(issueKey, targetStatusName) {
  const transitionId = await findTransitionId(issueKey, targetStatusName)
  if (!transitionId) {
    throw new Error(`No transition found for "${targetStatusName}"`)
  }

  await jiraRequest('POST', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`, {
    body: { transition: { id: transitionId } }
  })
}

async function transitionIfNeeded(issue, targetStatusName) {
  const current = String(issue.fields?.status?.name || '')
  if (current.toLowerCase() === targetStatusName.toLowerCase()) return
  await transitionIssue(issue.key, targetStatusName)
}

function runCodex(prompt) {
  const args = [
    'exec',
    '--cd',
    projectDir,
    '--skip-git-repo-check',
    '-s',
    'danger-full-access',
    '-c',
    `ask_for_approval="${config.codexAskForApproval}"`,
    prompt
  ]
  const result = spawnSync(config.codexBin, args, { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`codex exited with status ${result.status}`)
  }
}

function getOriginRepo() {
  const { stdout } = runGit(['remote', 'get-url', 'origin'])
  const url = stdout
  if (!url) throw new Error('Missing git remote "origin"')

  const sshMatch = url.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/)
  if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] }

  const httpsMatch = url.match(/^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/)
  if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2] }

  throw new Error(`Unsupported origin url: ${url}`)
}

function commitsAheadOf(baseRef) {
  const { stdout } = runGit(['rev-list', '--count', `${baseRef}..HEAD`])
  const parsed = Number.parseInt(stdout, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function runGh(args, { allowFailure } = {}) {
  const result = spawnSync(config.ghBin, args, { cwd: projectDir, encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0 && !allowFailure) {
    const stderr = (result.stderr || '').trim()
    throw new Error(stderr || `gh ${args.join(' ')} failed`)
  }
  return {
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    status: result.status ?? 0
  }
}

function detectPrProvider() {
  if (config.prProvider) return config.prProvider
  const ghOk = runGh(['--version'], { allowFailure: true }).status === 0
  if (ghOk) return 'gh'
  if (config.githubToken) return 'api'
  return ''
}

function ensureGhAuthed() {
  const status = runGh(['auth', 'status', '-h', 'github.com'], { allowFailure: true })
  if (status.status !== 0) {
    throw new Error('gh not authenticated. Run `gh auth login` first.')
  }
}

function createPullRequestWithGh({ title, body, head, base }) {
  ensureGhAuthed()
  const { owner, repo } = getOriginRepo()
  const repoSlug = `${owner}/${repo}`

  const view = runGh(['pr', 'view', '--repo', repoSlug, '--head', head, '--json', 'url', '--jq', '.url'], {
    allowFailure: true
  })
  if (view.status === 0 && view.stdout) return view.stdout

  const created = runGh(
    ['pr', 'create', '--repo', repoSlug, '--base', base, '--head', head, '--title', title, '--body', body],
    { allowFailure: true }
  )
  if (created.status === 0 && created.stdout) return created.stdout

  const viewAfter = runGh(['pr', 'view', '--repo', repoSlug, '--head', head, '--json', 'url', '--jq', '.url'], {
    allowFailure: true
  })
  if (viewAfter.status === 0 && viewAfter.stdout) return viewAfter.stdout

  const stderr = (created.stderr || '').trim()
  throw new Error(stderr || 'Failed to create PR via gh')
}

async function createPullRequest({ title, body, head, base }) {
  const provider = detectPrProvider()
  if (provider === 'gh') return createPullRequestWithGh({ title, body, head, base })
  if (provider === 'api') {
    if (!config.githubToken) throw new Error('Missing GITHUB_TOKEN (create `.env.github` from `.env.github.example`)')

    const { owner, repo } = getOriginRepo()
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({ title, body, head, base })
    })

    const text = await response.text()
    const json = text ? safeJsonParse(text) : null

    if (response.status === 422) {
      const listUrl = new URL(apiUrl)
      listUrl.searchParams.set('state', 'open')
      listUrl.searchParams.set('head', `${owner}:${head}`)
      const listRes = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${config.githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
      const listText = await listRes.text()
      const listJson = listText ? safeJsonParse(listText) : null
      const existing = Array.isArray(listJson) ? listJson[0] : null
      if (existing?.html_url) return existing.html_url
    }

    if (!response.ok) {
      const message = json?.message || text || `GitHub error ${response.status}`
      throw new Error(message)
    }

    const prUrl = json?.html_url
    if (!prUrl) throw new Error('GitHub PR created but URL missing')
    return prUrl
  }

  throw new Error('No PR provider available. Install/auth `gh` or set `GITHUB_TOKEN`.')
}

async function main() {
  console.log(`Jira: ${config.baseUrl}`)
  if (config.issueKey) {
    console.log(`Issue: ${config.issueKey}`)
  } else {
    console.log(`JQL: ${config.jql}`)
  }

  const issue = config.issueKey ? await getIssue(config.issueKey) : (await listTodoIssues())[0]
  if (!issue) {
    console.log('No matching Jira issues.')
    return
  }

  const summary = issue.fields?.summary || issue.key
  const status = issue.fields?.status?.name || 'Unknown'

  console.log(`Picked: ${issue.key} (${status}) - ${summary}`)

  if (config.dryRun) {
    console.log('Dry-run: would (1) ensure clean git, (2) checkout base + create branch, (3) transition to Doing if needed, (4) run Codex, (5) create PR, (6) transition to Done.')
    console.log('To execute: set `DRY_RUN=0`, `RUN_CODEX=1` and `CREATE_PR=1` (plus `GITHUB_TOKEN`).')
    return
  }

  ensureCleanWorkingTree()
  ensureBaseUpToDate()

  const branchName = `agent/${issue.key.toLowerCase()}-${slugify(summary)}`
  if (branchExists(branchName)) {
    runGit(['checkout', branchName])
  } else {
    runGit(['checkout', '-b', branchName])
  }

  console.log(`Transition -> ${config.doingStatus} (if needed)`)
  await transitionIfNeeded(issue, config.doingStatus)

  const prompt = buildCodexPrompt(issue)

  if (config.runCodex) {
    console.log('Running Codex...')
    runCodex(prompt)
  }

  if (config.autoDone && !config.createPr) {
    console.log(`AUTO_DONE=1 -> Transition -> ${config.doneStatus}`)
    await transitionIssue(issue.key, config.doneStatus)
    console.log('Done.')
    return
  }

  const baseRef = `origin/${config.gitBaseBranch}`
  const hasUncommitted = Boolean(runGit(['status', '--porcelain']).stdout)
  if (hasUncommitted) {
    runGit(['add', '-A'])
    runGit(['commit', '-m', `${issue.key}: ${summary}`])
  }

  const ahead = commitsAheadOf(baseRef)
  if (ahead === 0) {
    console.log('No branch changes vs base. Not creating PR and not transitioning to Done.')
    if (!config.runCodex) {
      console.log('RUN_CODEX=0: not running Codex automatically.')
      console.log('Suggested command (from `symfonyreact/`):')
      console.log('')
      console.log(
        `  codex exec --cd "${projectDir}" --skip-git-repo-check -s danger-full-access -c ask_for_approval="${config.codexAskForApproval}" ${JSON.stringify(prompt)}`
      )
      console.log('')
    }
    return
  }

  if (!config.createPr) {
    console.log('CREATE_PR=0: not creating a PR automatically.')
    console.log('Next steps:')
    console.log(`- Push branch: ${branchName}`)
    console.log('- Create a PR to main')
    console.log(`- Then transition Jira issue to "${config.doneStatus}"`)
    return
  }

  console.log('Creating PR...')
  runGit(['push', '-u', 'origin', branchName])

    const prUrl = await createPullRequest({
      title: `${issue.key}: ${summary}`,
      body: `Automated by jira-agent for ${issue.key}\n\n- Jira: ${issue.key}`,
      head: branchName,
      base: config.gitBaseBranch
    })

    console.log(`PR: ${prUrl}`)
    console.log(`Transition -> ${config.doneStatus}`)
    await transitionIssue(issue.key, config.doneStatus)
    console.log('Done.')
    return
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
