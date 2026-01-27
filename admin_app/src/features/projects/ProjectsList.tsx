import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, Box, Typography, Dialog, DialogTitle, DialogContent, TextField, 
  DialogActions, FormControlLabel, Checkbox, TablePagination, InputAdornment 
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useForm } from 'react-hook-form'
import { api } from '../../api/axios'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useNavigate } from 'react-router-dom'

interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  isArchived: boolean;
  isGlobal: boolean;
  isChargeable: boolean;
  budgetAmount: number
  budgetCurrency: string
}

interface ProjectsResponse {
  items: Project[];
  total: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') return fallback
  const response = (error as { response?: { data?: { message?: string | string[] } } }).response
  const message = response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}

export const ProjectsList = () => {
  console.log('ProjectsList rendered')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formError, setFormError] = useState('')
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()
  
  // Pagination & Search state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, rowsPerPage, debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      })
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      
      const res = await api.get<ProjectsResponse>('/admin/projects', { params })
      return res.data
    },
    placeholderData: (previousData) => previousData,
  })

  const projects = data?.items || []
  const totalCount = data?.total || 0

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/projects', data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['projects'] })
      handleClose()
    },
    onError: (error: unknown) => {
      setFormError(getErrorMessage(error, 'Failed to create project'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/admin/projects/${editingProject?.id}`, data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['projects'] })
      handleClose()
    },
    onError: (error: unknown) => {
      setFormError(getErrorMessage(error, 'Failed to update project'))
    }
  })

  const handleOpen = (project?: Project) => {
    setFormError('')
    if (project) {
      setEditingProject(project)
      setValue('name', project.name)
      setValue('code', project.code)
      setValue('description', project.description)
      setValue('isArchived', project.isArchived)
      setValue('isGlobal', project.isGlobal)
      setValue('isChargeable', project.isChargeable)
      setValue('budgetAmount', project.budgetAmount)
      setValue('budgetCurrency', project.budgetCurrency)
    } else {
      setEditingProject(null)
      reset({ budgetAmount: 0, budgetCurrency: 'EUR' })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingProject(null)
    setFormError('')
    reset()
  }

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      budgetCurrency: data.budgetCurrency ? String(data.budgetCurrency).toUpperCase() : data.budgetCurrency,
    }
    if (Number.isNaN(payload.budgetAmount)) {
      delete payload.budgetAmount
    }
    if (editingProject) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (isLoading && !data) return <div>Loading...</div>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projects</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>Add Project</Button>
      </Box>

      <Box mb={2}>
        <TextField
          label="Search Projects"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(0)
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Chargeable</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.code}</TableCell>
                <TableCell>{project.isArchived ? 'Archived' : 'Active'}</TableCell>
                <TableCell>{project.isGlobal ? 'Global' : 'Assigned'}</TableCell>
                <TableCell>{project.isChargeable ? 'Yes' : 'No'}</TableCell>
                <TableCell>{project.budgetAmount} {project.budgetCurrency}</TableCell>
                <TableCell align="right">
                  <Button onClick={() => navigate(`/projects/${project.id}`)} sx={{ mr: 1 }}>Manage</Button>
                  <Button onClick={() => handleOpen(project)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
               <TableRow>
                 <TableCell colSpan={7} align="center">No projects found</TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Name"
              fullWidth
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register('name', { required: 'Project name is required' })}
            />
            <TextField
              margin="dense"
              label="Code"
              fullWidth
              {...register('code')}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              {...register('description')}
            />
            <TextField
              margin="dense"
              label="Budget Amount"
              type="number"
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              error={Boolean(errors.budgetAmount)}
              helperText={errors.budgetAmount?.message}
              {...register('budgetAmount', {
                valueAsNumber: true,
                min: { value: 0, message: 'Budget must be 0 or higher' },
              })}
            />
            <TextField
              margin="dense"
              label="Budget Currency"
              fullWidth
              error={Boolean(errors.budgetCurrency)}
              helperText={errors.budgetCurrency?.message}
              {...register('budgetCurrency', {
                pattern: { value: /^[A-Z]{3}$/, message: 'Use a 3-letter code (e.g. EUR)' },
              })}
            />
            <FormControlLabel
              control={<Checkbox defaultChecked={editingProject ? editingProject.isGlobal : false} {...register('isGlobal')} />}
              label="Global (Available to everyone)"
            />
            <FormControlLabel
              control={<Checkbox defaultChecked={editingProject ? editingProject.isChargeable : true} {...register('isChargeable')} />}
              label="Chargeable"
            />
            {editingProject && (
              <FormControlLabel
                control={<Checkbox defaultChecked={editingProject.isArchived} {...register('isArchived')} />}
                label="Archived"
              />
            )}
            {formError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {formError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
