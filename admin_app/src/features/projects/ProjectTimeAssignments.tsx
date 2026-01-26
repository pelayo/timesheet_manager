import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DeleteIcon from '@mui/icons-material/Delete'
import { startOfWeek, addWeeks, format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { api } from '../../api/axios'

interface TimeAssignment {
  id: string
  userId: string
  weekStart: string
  hours: number
  user: {
    id: string
    email: string
  }
}

interface ProjectMember {
  userId: string
  user: {
    id: string
    email: string
  }
}

const HOURS_STEP = 0.25
const WEEKS_PER_PAGE = 12

export const ProjectTimeAssignments = () => {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )
  const [open, setOpen] = useState(false)
  const [extraUserIds, setExtraUserIds] = useState<string[]>([])
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({})
  const { register, handleSubmit, reset } = useForm()

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'time-assignments'],
    queryFn: async () => {
      const res = await api.get<TimeAssignment[]>(`/admin/projects/${projectId}/time-assignments`)
      return res.data
    }
  })

  const { data: members } = useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: async () => {
      const res = await api.get<ProjectMember[]>(`/admin/projects/${projectId}/members`)
      return res.data
    }
  })

  const assignmentsByUserWeek = useMemo(() => {
    const map = new Map<string, TimeAssignment>()
    assignments?.forEach((assignment) => {
      map.set(`${assignment.userId}:${assignment.weekStart}`, assignment)
    })
    return map
  }, [assignments])

  const memberMap = useMemo(() => {
    const map = new Map<string, ProjectMember>()
    members?.forEach((member) => map.set(member.userId, member))
    return map
  }, [members])

  const assignmentUserIds = useMemo(() => {
    const set = new Set<string>()
    assignments?.forEach((assignment) => set.add(assignment.userId))
    return set
  }, [assignments])

  const rowUserIds = useMemo(() => {
    const set = new Set<string>()
    assignmentUserIds.forEach((id) => set.add(id))
    extraUserIds.forEach((id) => set.add(id))
    return Array.from(set)
  }, [assignmentUserIds, extraUserIds])

  const weekStarts = useMemo(
    () => Array.from({ length: WEEKS_PER_PAGE }, (_, index) => addWeeks(currentWeek, index)),
    [currentWeek],
  )

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/admin/projects/${projectId}/time-assignments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-assignments'] })
      handleClose()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; hours: number }) =>
      api.patch(`/admin/time-assignments/${data.id}`, { hours: data.hours }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-assignments'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/time-assignments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-assignments'] })
  })

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  const onSubmit = (data: any) => {
    const userId = data.userId as string
    if (!userId) return
    setExtraUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]))
    handleClose()
  }

  const handlePrev = () => setCurrentWeek((prev) => addWeeks(prev, -WEEKS_PER_PAGE))
  const handleNext = () => setCurrentWeek((prev) => addWeeks(prev, WEEKS_PER_PAGE))

  const handleCellChange = (userId: string, weekStart: string, value: string) => {
    const key = `${userId}:${weekStart}`
    setDraftValues((prev) => ({ ...prev, [key]: value }))
    setDirtyMap((prev) => ({ ...prev, [key]: true }))
  }

  const handleSave = async () => {
    const dirtyKeys = Object.keys(dirtyMap).filter((key) => dirtyMap[key])
    if (dirtyKeys.length === 0) return

    const actions = dirtyKeys.map(async (key) => {
      const [userId, weekStart] = key.split(':')
      const rawValue = draftValues[key] ?? ''
      const parsed = Number(rawValue)
      const assignment = assignmentsByUserWeek.get(key)

      if (!rawValue || Number.isNaN(parsed) || parsed <= 0) {
        if (assignment) {
          await deleteMutation.mutateAsync(assignment.id)
        }
        return
      }

      if (assignment) {
        if (assignment.hours !== parsed) {
          await updateMutation.mutateAsync({ id: assignment.id, hours: parsed })
        }
        return
      }

      await createMutation.mutateAsync({ userId, weekStart, hours: parsed })
    })

    await Promise.all(actions)
    setDirtyMap({})
    setDraftValues({})
  }

  if (isLoading) return <div>Loading assignments...</div>

  const availableMembers = members?.filter((member) => !rowUserIds.includes(member.userId)) || []
  const hasPendingChanges = Object.values(dirtyMap).some(Boolean)

  return (
    <Box sx={{ pb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Time Assignments</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" size="small" onClick={handleSave} disabled={!hasPendingChanges}>
            Save Changes
          </Button>
          <Button variant="contained" size="small" onClick={handleOpen}>
            Add User Allocation
          </Button>
        </Box>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="flex-end" mb={2}>
        <IconButton onClick={handlePrev}><ArrowBackIcon /></IconButton>
        <Typography variant="body2" sx={{ mx: 1 }}>
          {format(currentWeek, 'MMM d, yyyy')} - {format(addWeeks(currentWeek, WEEKS_PER_PAGE - 1), 'MMM d, yyyy')}
        </Typography>
        <IconButton onClick={handleNext}><ArrowForwardIcon /></IconButton>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              {weekStarts.map((weekStart) => (
                <TableCell key={weekStart.toISOString()} align="center">
                  {format(weekStart, 'MMM d')}
                </TableCell>
              ))}
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rowUserIds.map((userId) => {
              const member = memberMap.get(userId)
              const label = member?.user.email || assignments?.find(a => a.userId === userId)?.user?.email || userId
              return (
                <TableRow key={userId}>
                  <TableCell>{label}</TableCell>
                  {weekStarts.map((weekStart) => {
                    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
                    const assignment = assignmentsByUserWeek.get(`${userId}:${weekStartStr}`)
                    const cellKey = `${userId}:${weekStartStr}`
                    const value =
                      draftValues[cellKey] ??
                      (assignment?.hours !== undefined ? String(assignment.hours) : '')
                    return (
                      <TableCell key={`${userId}-${weekStartStr}`} align="center" sx={{ p: 0.5 }}>
                        <TextField
                          type="number"
                          size="small"
                          value={value}
                          onChange={(e) => handleCellChange(userId, weekStartStr, e.target.value)}
                          inputProps={{ step: HOURS_STEP, min: 0, style: { textAlign: 'center' } }}
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                    )
                  })}
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        assignments
                          ?.filter((assignment) => assignment.userId === userId)
                          .forEach((assignment) => deleteMutation.mutate(assignment.id))
                        setExtraUserIds((prev) => prev.filter((id) => id !== userId))
                        setDraftValues((prev) => {
                          const next = { ...prev }
                          weekStarts.forEach((weekStart) => {
                            const weekStartStr = format(weekStart, 'yyyy-MM-dd')
                            delete next[`${userId}:${weekStartStr}`]
                          })
                          return next
                        })
                        setDirtyMap((prev) => {
                          const next = { ...prev }
                          weekStarts.forEach((weekStart) => {
                            const weekStartStr = format(weekStart, 'yyyy-MM-dd')
                            delete next[`${userId}:${weekStartStr}`]
                          })
                          return next
                        })
                      }}
                      title="Remove all allocations"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
            {rowUserIds.length === 0 && (
              <TableRow>
                <TableCell colSpan={WEEKS_PER_PAGE + 2} align="center">
                  No assignments yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add User Allocation</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ minWidth: 320 }}>
            {!members ? (
              <CircularProgress />
            ) : (
              <>
                <TextField
                  select
                  margin="dense"
                  label="User"
                  fullWidth
                  defaultValue=""
                  {...register('userId', { required: true })}
                >
                  {availableMembers.map((member) => (
                    <MenuItem key={member.userId} value={member.userId}>
                      {member.user.email}
                    </MenuItem>
                  ))}
                  {availableMembers.length === 0 && <MenuItem disabled>No available members</MenuItem>}
                </TextField>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={availableMembers.length === 0}>Add</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
