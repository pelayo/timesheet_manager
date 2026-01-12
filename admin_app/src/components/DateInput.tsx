import { useEffect, useState } from 'react'
import { TextField, TextFieldProps } from '@mui/material'
import { formatDisplayDate, parseDisplayDate } from '../utils/date'

interface DateInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  size?: TextFieldProps['size']
  fullWidth?: boolean
  margin?: TextFieldProps['margin']
}

export const DateInput = ({ label, value, onChange, onBlur, size, fullWidth, margin }: DateInputProps) => {
  const [displayValue, setDisplayValue] = useState(formatDisplayDate(value))

  useEffect(() => {
    setDisplayValue(formatDisplayDate(value))
  }, [value])

  const handleChange = (nextValue: string) => {
    setDisplayValue(nextValue)

    if (!nextValue) {
      onChange('')
      return
    }

    const parsed = parseDisplayDate(nextValue)
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      onChange(parsed)
    }
  }

  const handleBlur = () => {
    if (!displayValue) {
      onBlur?.()
      return
    }

    const parsed = parseDisplayDate(displayValue)
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      onChange(parsed)
      setDisplayValue(formatDisplayDate(parsed))
    } else {
      setDisplayValue(formatDisplayDate(value))
    }

    onBlur?.()
  }

  return (
    <TextField
      label={label}
      value={displayValue}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      placeholder="dd/mm/yyyy"
      size={size}
      fullWidth={fullWidth}
      margin={margin}
      inputProps={{ inputMode: 'numeric', pattern: '\\d{2}/\\d{2}/\\d{4}' }}
      InputLabelProps={{ shrink: true }}
    />
  )
}
