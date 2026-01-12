import { format, parse, parseISO, isValid } from 'date-fns'

const DISPLAY_FORMAT = 'dd/MM/yyyy'
const API_FORMAT = 'yyyy-MM-dd'

export const formatDisplayDate = (value: string) => {
  if (!value) return ''

  const isoMatch = /^\d{4}-\d{2}-\d{2}/.test(value)
  const date = isoMatch ? parseISO(value) : parse(value, DISPLAY_FORMAT, new Date())

  if (!isValid(date)) return value

  return format(date, DISPLAY_FORMAT)
}

export const parseDisplayDate = (value: string) => {
  if (!value) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const parsed = parse(value, DISPLAY_FORMAT, new Date())
  if (!isValid(parsed)) return value

  return format(parsed, API_FORMAT)
}
