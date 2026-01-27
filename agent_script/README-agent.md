# Jira Agent (trivial)

Objetivo: el script (no tú) coge una tarea de Jira, la mueve a `Doing`, ejecuta Codex sobre este repo (frontend React/Vite + backend NestJS) con un prompt basado en la tarea, crea un PR, y finalmente la mueve a `Done` (o el estado configurado).

## 1) Configurar credenciales

1. Crea un API token de Jira (Atlassian):
   - https://id.atlassian.com/manage-profile/security/api-tokens
2. Crea `.env.agent` en la raíz del repo (si no existe)
3. Rellena:
   - `JIRA_URL`
   - `JIRA_EMAIL`
   - `JIRA_TOKEN`
   - `JIRA_PROJECT_KEY`
   - `JIRA_TODO_STATUS` (ej. `Tareas Por Hacer`)
   - `JIRA_DOING_STATUS` (ej. `Doing`)
   - `JIRA_DEVELOP_STATUS` (ej. `DEVELOPED`)
   - `JIRA_DONE_STATUS` (ej. `Done`)
   - `JIRA_PANEL_ID` (ej. `1253`)

Recomendación para “tareas para mí”:
- Si quieres filtrar por usuario, añade `assignee=currentUser()` en `JIRA_JQL`.
- Si no, deja el JQL por defecto (sin assignee) o usa `JIRA_ISSUE_KEY`.

## 2) (Opcional) Crear PR automáticamente

### Opción A (recomendada): `gh`

1. Instala `gh`:
   - `brew install gh`
2. Autentica:
   - `gh auth login`
3. En `.env.agent`:
   - `PR_PROVIDER=gh`
   - `CREATE_PR=1`

### Opción B: token (API)

1. Crea un token de GitHub:
   - https://github.com/settings/tokens
2. En `.env.agent`:
   - `PR_PROVIDER=api`
   - `GITHUB_TOKEN=...`
   - `CREATE_PR=1`

## 3) Apuntar a una issue concreta (recomendado para pruebas)

En `.env.agent`:
- `JIRA_ISSUE_KEY=CT-7`

Así el agente no depende del JQL ni del estado actual.

## 4) Modo dry-run (no hace cambios)

```bash
node agent_script/jira-agent.mjs
```

## 5) Modo real

En `.env.agent`:
- `DRY_RUN=0`

Opcional para ejecutar Codex automáticamente:
- `RUN_CODEX=1`

Opcional para evitar prompts de aprobación:
- `CODEX_ASK_FOR_APPROVAL=never`

Para crear PR automáticamente:
- `CREATE_PR=1` en `.env.agent`

Luego:
```bash
node agent_script/jira-agent.mjs
```

Notas:
- Si tus estados no se llaman `Doing`/`Done`, cambia `JIRA_DOING_STATUS` y `JIRA_DONE_STATUS`.
- El agente elige la primera issue del JQL (`maxResults=5`) si no usas `JIRA_ISSUE_KEY`.
- Si `RUN_CODEX=0`, el agente solo mueve a `Doing` y te imprime el comando de `codex exec` (no marca `Done`).
