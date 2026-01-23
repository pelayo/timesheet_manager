import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { addWeeks, format, parseISO, startOfWeek } from 'date-fns'
import { api } from '../../api/axios'

interface User {
  id: string
  email: string
  role: 'admin' | 'user' | 'project_manager'
}

interface UsersResponse {
  items: User[]
  total: number
}

interface AssignmentSummary {
  userId: string
  userEmail: string
  projectId: string
  projectName: string
  weekStart: string
  hours: number
}

const WEEKS_PER_PAGE = 12

export const GlobalTimeAssignments = () => {
  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )
  const weekStartStr = format(currentWeek, 'yyyy-MM-dd')

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const res = await api.get<UsersResponse>('/admin/users?limit=1000')
      return res.data
    }
  })

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['time-assignments-summary', weekStartStr],
    queryFn: async () => {
      const params = new URLSearchParams({
        weekStart: weekStartStr,
        weeks: WEEKS_PER_PAGE.toString(),
      })
      const res = await api.get<AssignmentSummary[]>('/admin/time-assignments/weekly-summary', { params })
      return res.data
    }
  })

  const summaryMap = useMemo(() => {
    const map = new Map<string, AssignmentSummary[]>()
    summary?.forEach((item) => {
      const normalizedWeekStart = item.weekStart
        ? format(parseISO(item.weekStart), 'yyyy-MM-dd')
        : item.weekStart
      const key = `${item.userId}:${normalizedWeekStart}`
      const existing = map.get(key) ?? []
      map.set(key, [...existing, item])
    })
    return map
  }, [summary])

  const users = useMemo(() => {
    const baseUsers = usersData?.items ?? []
    const summaryUsers = new Map<string, User>()
    summary?.forEach((item) => {
      summaryUsers.set(item.userId, { id: item.userId, email: item.userEmail, role: 'user' })
    })

    const combined = new Map<string, User>()
    baseUsers.forEach((user) => combined.set(user.id, user))
    summaryUsers.forEach((user, id) => {
      if (!combined.has(id)) combined.set(id, user)
    })

    return Array.from(combined.values()).filter(
      (user) => user.role === 'user' || summaryUsers.has(user.id),
    )
  }, [usersData, summary])

  const weeks = useMemo(
    () => Array.from({ length: WEEKS_PER_PAGE }, (_, index) => addWeeks(currentWeek, index)),
    [currentWeek],
  )

  const handlePrev = () => setCurrentWeek((prev) => addWeeks(prev, -WEEKS_PER_PAGE))
  const handleNext = () => setCurrentWeek((prev) => addWeeks(prev, WEEKS_PER_PAGE))

  if (usersLoading || summaryLoading) {
    return <CircularProgress />
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Assignments Overview</Typography>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handlePrev}><ArrowBackIcon /></IconButton>
          <Typography variant="body2" sx={{ mx: 1 }}>
            {format(currentWeek, 'MMM d, yyyy')} - {format(addWeeks(currentWeek, WEEKS_PER_PAGE - 1), 'MMM d, yyyy')}
          </Typography>
          <IconButton onClick={handleNext}><ArrowForwardIcon /></IconButton>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              {weeks.map((week) => (
                <TableCell key={week.toISOString()} align="center">
                  {format(week, 'MMM d')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                {weeks.map((week) => {
                  const weekStart = format(week, 'yyyy-MM-dd')
                  const items = summaryMap.get(`${user.id}:${weekStart}`) ?? []
                  return (
                    <TableCell key={`${user.id}-${weekStart}`} align="center" sx={{ minWidth: 160 }}>
                      {items.length === 0
                        ? ''
                        : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {items.map(item => (
                              <Typography key={`${item.projectId}-${item.projectName}`} variant="caption">
                                {item.projectName} - {item.hours.toFixed(2)}
                              </Typography>
                            ))}
                          </Box>
                        )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={WEEKS_PER_PAGE + 1} align="center">
                  No assignments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
