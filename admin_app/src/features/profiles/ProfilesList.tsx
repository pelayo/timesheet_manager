import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { api } from '../../api/axios'

interface Profile {
  id: string
  name: string
  discipline: string
  level: string
  costPerHour: number
  active: boolean
}

interface ProfileFormValues {
  name: string
  discipline: string
  level: string
  costPerHour: number
  active: boolean
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') return fallback
  const response = (error as { response?: { data?: { message?: string | string[] } } }).response
  const message = response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}

export const ProfilesList = () => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      active: true,
      costPerHour: 0,
    },
  })

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const res = await api.get<Profile[]>('/admin/profiles')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => api.post('/admin/profiles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      handleClose()
    },
    onError: (error: unknown) => setFormError(getErrorMessage(error, 'Failed to create profile')),
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      api.patch(`/admin/profiles/${editingProfile?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      handleClose()
    },
    onError: (error: unknown) => setFormError(getErrorMessage(error, 'Failed to update profile')),
  })

  const handleOpen = (profile?: Profile) => {
    setFormError('')
    if (profile) {
      setEditingProfile(profile)
      setValue('name', profile.name)
      setValue('discipline', profile.discipline)
      setValue('level', profile.level)
      setValue('costPerHour', profile.costPerHour)
      setValue('active', profile.active)
    } else {
      setEditingProfile(null)
      reset({ active: true, costPerHour: 0 })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingProfile(null)
    setFormError('')
    reset({ active: true, costPerHour: 0 })
  }

  const onSubmit = (data: ProfileFormValues) => {
    if (editingProfile) {
      updateMutation.mutate(data)
      return
    }
    createMutation.mutate(data)
  }

  if (isLoading && !profiles) return <div>Loading...</div>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Profiles</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>
          Add Profile
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Discipline</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Cost / Hour</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profiles?.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>{profile.name}</TableCell>
                <TableCell>{profile.discipline}</TableCell>
                <TableCell>{profile.level}</TableCell>
                <TableCell>{profile.costPerHour}</TableCell>
                <TableCell>{profile.active ? 'Active' : 'Inactive'}</TableCell>
                <TableCell align="right">
                  <Button onClick={() => handleOpen(profile)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {profiles?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No profiles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProfile ? 'Edit Profile' : 'New Profile'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />
            <TextField
              margin="dense"
              label="Discipline"
              fullWidth
              error={Boolean(errors.discipline)}
              helperText={errors.discipline?.message}
              {...register('discipline', { required: 'Discipline is required' })}
            />
            <TextField
              margin="dense"
              label="Level"
              fullWidth
              error={Boolean(errors.level)}
              helperText={errors.level?.message}
              {...register('level', { required: 'Level is required' })}
            />
            <TextField
              margin="dense"
              label="Cost per hour"
              type="number"
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              error={Boolean(errors.costPerHour)}
              helperText={errors.costPerHour?.message}
              {...register('costPerHour', {
                valueAsNumber: true,
                min: { value: 0, message: 'Cost must be 0 or higher' },
                required: 'Cost is required',
              })}
            />
            <FormControlLabel
              control={<Checkbox {...register('active')} />}
              label="Active"
            />
            {formError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {formError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
