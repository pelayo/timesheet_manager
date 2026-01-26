export const DEFAULT_TEAMWORK_TASK_NAME = 'Project General'

export const resolveTaskName = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length > 0) {
      return { name: trimmed, usedFallback: false }
    }
  }

  return { name: DEFAULT_TEAMWORK_TASK_NAME, usedFallback: true }
}
