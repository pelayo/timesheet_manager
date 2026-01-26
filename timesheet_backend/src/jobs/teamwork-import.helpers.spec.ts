import { DEFAULT_TEAMWORK_TASK_NAME, resolveTaskName } from './teamwork-import.helpers'

describe('resolveTaskName', () => {
  it('returns provided task name when present', () => {
    const result = resolveTaskName('Build API')
    expect(result).toEqual({ name: 'Build API', usedFallback: false })
  })

  it('falls back when task name is blank', () => {
    const result = resolveTaskName('   ')
    expect(result).toEqual({ name: DEFAULT_TEAMWORK_TASK_NAME, usedFallback: true })
  })

  it('falls back when task name is missing', () => {
    const result = resolveTaskName(null)
    expect(result).toEqual({ name: DEFAULT_TEAMWORK_TASK_NAME, usedFallback: true })
  })
})
