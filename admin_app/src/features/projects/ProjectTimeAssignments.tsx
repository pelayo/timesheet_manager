import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Box, Typography, TextField, MenuItem, CircularProgress
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Controller, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { api } from '../../api/axios'
import { DateInput } from '../../components/DateInput'
import { formatDisplayDate } from '../../utils/date'

interface TimeAssignment {
  id: string
  userId: string
  startDate: string
  endDate: string
  hours: number
  user: {
    id: string
    email: string
  }
}

interface User {
  id: string
  email: string
}

export const ProjectTimeAssignments = () => {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<TimeAssignment | null>(null)
  const { control, register, handleSubmit, reset, setValue } = useForm()

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'time-assignments'],
    queryFn: async () => {
      const res = await api.get<TimeAssignment[]>(`/admin/projects/${projectId}/time-assignments`)
      return res.data
    }
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<{ items: User[] }>('/admin/users?limit=1000')
      return res.data
    },
    enabled: open
  })

  const users = usersData?.items

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/admin/projects/${projectId}/time-assignments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-assignments'] })
      handleClose()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/admin/time-assignments/${editingAssignment?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-assignments'] })
      handleClose()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/time-assignments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-assignments'] })
  })

  const handleOpen = (assignment?: TimeAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment)
      setValue('userId', assignment.userId)
      setValue('startDate', assignment.startDate)
      setValue('endDate', assignment.endDate)
      setValue('hours', assignment.hours)
    } else {
      setEditingAssignment(null)
      reset()
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingAssignment(null)
    reset()
  }

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      hours: Number(data.hours),
    }

    if (editingAssignment) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  if (isLoading) return <div>Loading assignments...</div>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Time Assignments</Typography>
        <Button variant="contained" size="small" onClick={() => handleOpen()}>Add Assignment</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Date Range</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments?.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>{assignment.user?.email || assignment.userId}</TableCell>
                <TableCell>{formatDisplayDate(assignment.startDate)} to {formatDisplayDate(assignment.endDate)}</TableCell>
                <TableCell>{assignment.hours}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(assignment)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(assignment.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {assignments?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">No assignments yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ minWidth: 320 }}>
            {!users ? (
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
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.email}
                    </MenuItem>
                  ))}
                </TextField>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <DateInput
                      label="Start Date (inclusive)"
                      fullWidth
                      margin="dense"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <Controller
                  name="endDate"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <DateInput
                      label="End Date (inclusive)"
                      fullWidth
                      margin="dense"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <TextField
                  type="number"
                  margin="dense"
                  label="Hours"
                  fullWidth
                  inputProps={{ step: 0.25, min: 0 }}
                  {...register('hours', { required: true })}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
