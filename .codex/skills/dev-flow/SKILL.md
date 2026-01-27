---
name: dev-flow
description: "Flujo compacto por fases para iniciar o retomar proyectos, planificar (diseno/requisitos/tareas/roadmap), ejecutar, validar con commit+PR y sincronizar cambios con Git Flow. Keywords: init, resume, plan, execute, validate, sync, PR, Bitbucket, roadmap."
metadata:
  author: XT
  version: "0.1.0"
---

# Dev Flow

## Purpose

Definir un flujo compacto y explicito para desarrollo en fases: **init**, **resume**, **plan**, **execute**, **validate** y **sync**.

## When to use / Activation hints

Usa esta skill cuando el usuario pida:

- iniciar un proyecto desde cero
- retomar un repositorio existente
- planificar una feature (diseno, requisitos, historias, roadmap)
- ejecutar un plan aprobado
- validar con tests/lint/build y cerrar con commit+PR
- sincronizar cambios remotos en la rama local

## Inputs (ask if missing)

Si falta informacion necesaria en cualquier fase, **pregunta al usuario antes de actuar**.

Inputs comunes:

- objetivo o alcance
- tipo de trabajo: feature | bugfix | release | hotfix
- ID de Jira (si aplica)
- branch principal: main | master
- branch de integracion: develop
- hosting: Bitbucket (por defecto) o GitHub (excepcion)

## Outputs

- Planificacion en archivos:
  - `docs/DESIGN.md`
  - `docs/REQUIREMENTS.md`
  - `docs/TASKS.md`
  - `docs/ROADMAP.md`
- Cambios de codigo implementados y validados
- Commits y PR creados segun Git Flow

## Global rules

- Para operaciones Git, aplica **git-corporate-workflow**.
- `validate` es **fail-hard**: si tests/lint/build fallan, no hay commit ni PR.
- No commits directos a `develop`/`main`/`master`.
- `rebase` solo en ramas locales privadas.
- Si hay dudas de branch destino, **pregunta**.

---

# Phase: init

## Goal

Iniciar un proyecto nuevo con base funcional minima.

## Steps

1. Confirma stack, nombre del proyecto y repo remoto (si aplica).
2. Inicializa el repo (si no existe) y estructura minima.
3. Instala dependencias y crea el bootstrap minimo.
4. Ejecuta un smoke test o instruccion de arranque.
5. Documenta como ejecutar localmente.

## If missing info

Pregunta por stack, nombre, repositorio remoto, branch principal y si se usa Git Flow.

---

# Phase: resume

## Goal

Cargar el estado real del repo antes de planificar o ejecutar.

## Steps

1. Inspecciona ramas y remotos.
2. Detecta cambios locales sin commit.
3. Identifica base branch correcta segun tipo de trabajo.
4. Localiza entrypoints relevantes y dependencias clave.
5. Si hace falta, propone `sync`.

## If missing info

Pregunta por tipo de trabajo, ID de Jira, branch base y objetivo actual.

---

# Phase: plan

## Goal

Crear diseno, requisitos, tareas y roadmap.

## Steps

1. Clarifica objetivo, alcance, restricciones y criterios de aceptacion.
2. Redacta `docs/DESIGN.md`.
3. Redacta `docs/REQUIREMENTS.md`.
4. Redacta `docs/TASKS.md`.
5. Redacta/actualiza `docs/ROADMAP.md`.
6. Pide confirmacion del plan antes de ejecutar.

## Document templates

`docs/DESIGN.md`:

- Overview
- Architecture (diagramas si aplica)
- Data flow
- APIs / Interfaces
- Decisions (trade-offs)
- Risks / Non-goals

`docs/REQUIREMENTS.md`:

- Goal
- Scope (in/out)
- User stories (con aceptacion)
- Functional requirements
- Non-functional requirements
- Constraints / Dependencies

`docs/TASKS.md`:

- Task list con estados (todo | doing | done)
- Dependencias
- Estimaciones ligeras si aporta valor

`docs/ROADMAP.md`:

- Fases (Phase 1, Phase 2, ...)
- Tareas por fase con estado (todo | doing | done)
- Lista corta de tareas en curso

## If missing info

Pregunta por alcance, restricciones, prioridades y criterios de aceptacion.

---

# Phase: execute

## Goal

Implementar el plan de forma incremental y trazable.

## Steps

1. Selecciona la tarea prioritaria.
2. Implementa cambios pequenos y revisables.
3. Auto-revision rapida.
4. Actualiza `docs/TASKS.md` y `docs/ROADMAP.md` si cambia el estado.

## If missing info

Pregunta que tarea atacar primero o solicita confirmacion del orden.

---

# Phase: validate

## Goal

Validar calidad y cerrar con commit + PR.

## Steps

1. Ejecuta tests/lint/build relevantes.
2. Si falla algo: **deten**, informa y pide decision.
3. Realiza code review de los cambios.
4. Aplica fixes necesarios.
5. Crea commit(s) semanticos con ID de Jira.
6. Crea PR al branch correcto:
   - feature/bugfix -> `develop`
   - release/hotfix -> `main`/`master`

## If missing info

Pregunta por tipo de trabajo, branch destino y convencion de commits.

---

# Phase: sync

## Goal

Traer cambios remotos e integrar localmente.

## Steps

1. `git fetch`.
2. Verifica estado local limpio.
3. Aplica modo:
   - **merge** (default) para ramas compartidas.
   - **rebase** solo en ramas locales privadas.
   - **ff-only** si no hay cambios locales.
4. Resuelve conflictos y valida estado.

## If missing info

Pregunta por el modo deseado (merge/rebase/ff-only).

---

# Safety / Constraints

- No introducir secretos o credenciales.
- No reescribir historial en ramas compartidas.
- No commits directos a ramas protegidas.
- Fail-hard en `validate` si tests/lint/build fallan.
