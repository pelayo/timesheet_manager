import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
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
import SearchIcon from '@mui/icons-material/Search'
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

interface CumulativeTeamworkSummary {
  userId: string
  userEmail: string
  projectId: string
  projectName: string
  hours: number
}

const WEEKS_PER_PAGE = 4
const USERS_PER_PAGE = 20

export const GlobalTimeAssignments = () => {
  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )
  const weekStartStr = format(currentWeek, 'yyyy-MM-dd')
  const [userPage, setUserPage] = useState(0)
  const [userSearch, setUserSearch] = useState('')

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<User>('/user/me')
      return res.data
    },
    retry: false,
  })

  const { data: usersData, isLoading: usersLoading, isFetching: usersFetching } = useQuery({
    queryKey: ['users', 'page', userPage, 'limit', USERS_PER_PAGE, 'search', userSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (userPage + 1).toString(),
        limit: USERS_PER_PAGE.toString(),
      })
      if (userSearch.trim()) {
        params.set('search', userSearch.trim())
      }
      const res = await api.get<UsersResponse>('/admin/users', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
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

  const showCumulative = me?.role === 'admin'

  const { data: cumulativeSummary, isLoading: cumulativeLoading } = useQuery({
    queryKey: ['time-assignments-teamwork-cumulative', weekStartStr],
    enabled: showCumulative,
    queryFn: async () => {
      const params = new URLSearchParams({ weekStart: weekStartStr })
      const res = await api.get<CumulativeTeamworkSummary[]>(
        '/admin/time-assignments/teamwork-cumulative',
        { params },
      )
      return res.data
    },
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

  const cumulativeMap = useMemo(() => {
    const map = new Map<string, CumulativeTeamworkSummary[]>()
    cumulativeSummary?.forEach((item) => {
      const existing = map.get(item.userId) ?? []
      map.set(item.userId, [...existing, item])
    })
    return map
  }, [cumulativeSummary])

  const users = useMemo(() => {
    const baseUsers = usersData?.items ?? []
    const summaryUsers = new Set((summary ?? []).map((item) => item.userId))
    const cumulativeUsers = new Set((cumulativeSummary ?? []).map((item) => item.userId))
    return baseUsers.filter(
      (user) => user.role === 'user' || summaryUsers.has(user.id) || cumulativeUsers.has(user.id),
    )
  }, [usersData, summary, cumulativeSummary])

  const weeks = useMemo(
    () => Array.from({ length: WEEKS_PER_PAGE }, (_, index) => addWeeks(currentWeek, index)),
    [currentWeek],
  )

  const cellSx = {
    borderRight: '1px solid',
    borderColor: 'divider',
    '&:last-child': {
      borderRight: 0,
    },
  }

  const handlePrev = () => setCurrentWeek((prev) => addWeeks(prev, -WEEKS_PER_PAGE))
  const handleNext = () => setCurrentWeek((prev) => addWeeks(prev, WEEKS_PER_PAGE))

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch(event.target.value)
    setUserPage(0)
  }

  const formatUserLabel = (email: string) => {
    const name = email.split('@')[0] ?? email
    if (name.length <= 18) return name
    return `${name.slice(0, 18)}...`
  }

  if (
    meLoading ||
    summaryLoading ||
    (showCumulative && cumulativeLoading) ||
    (usersLoading && !usersData)
  ) {
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          size="small"
          placeholder="Search username"
          value={userSearch}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: usersFetching ? (
              <InputAdornment position="end">
                <CircularProgress size={16} />
              </InputAdornment>
            ) : undefined,
          }}
          sx={{ minWidth: 240 }}
        />
        <Typography variant="body2">
          Page {userPage + 1} of {Math.max(1, Math.ceil((usersData?.total ?? 0) / USERS_PER_PAGE))}
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 140, ...cellSx }}>User</TableCell>
              {showCumulative && (
                <TableCell align="center" sx={{ minWidth: 260, ...cellSx }}>
                  Teamwork to date
                </TableCell>
              )}
              {weeks.map((week) => (
                <TableCell key={week.toISOString()} align="center" sx={cellSx}>
                  {format(week, 'MMM d')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell title={user.email} sx={cellSx}>
                  {formatUserLabel(user.email)}
                </TableCell>
                {showCumulative && (
                  <TableCell align="center" sx={{ minWidth: 260, ...cellSx }}>
                    {(cumulativeMap.get(user.id) ?? []).length === 0
                      ? ''
                      : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {(cumulativeMap.get(user.id) ?? []).map(item => (
                            <Typography key={`${item.projectId}-${item.projectName}`} variant="caption">
                              {item.projectName} - {item.hours.toFixed(2)}
                            </Typography>
                          ))}
                        </Box>
                      )}
                  </TableCell>
                )}
                {weeks.map((week) => {
                  const weekStart = format(week, 'yyyy-MM-dd')
                  const items = summaryMap.get(`${user.id}:${weekStart}`) ?? []
                  return (
                    <TableCell
                      key={`${user.id}-${weekStart}`}
                      align="center"
                      sx={{ minWidth: 120, ...cellSx }}
                    >
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
                <TableCell
                  colSpan={WEEKS_PER_PAGE + 1 + (showCumulative ? 1 : 0)}
                  align="center"
                  sx={cellSx}
                >
                  No assignments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
        <IconButton
          size="small"
          onClick={() => setUserPage((prev) => Math.max(prev - 1, 0))}
          disabled={userPage === 0}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setUserPage((prev) => prev + 1)}
          disabled={(userPage + 1) * USERS_PER_PAGE >= (usersData?.total ?? 0)}
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}
