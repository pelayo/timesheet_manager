import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  IconButton, Chip, Box, Typography
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { api } from '../../api/axios';

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'OPEN' | 'CLOSED';
}

export const ProjectTasks = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: async () => {
      const res = await api.get<Task[]>(`/admin/projects/${projectId}/tasks`);
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/admin/projects/${projectId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      handleClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/admin/tasks/${editingTask?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      handleClose();
    }
  });

  const closeTaskMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/tasks/${id}/close`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
  });

  const reopenTaskMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/tasks/${id}/reopen`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
  });

  const handleOpen = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setValue('name', task.name);
      setValue('description', task.description);
    } else {
      setEditingTask(null);
      reset();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTask(null);
    reset();
  };

  const onSubmit = (data: any) => {
    if (editingTask) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <div>Loading tasks...</div>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Tasks</Typography>
        <Button variant="contained" size="small" onClick={() => handleOpen()}>Add Task</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks?.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Typography variant="subtitle2">{task.name}</Typography>
                  <Typography variant="caption" color="textSecondary">{task.description}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={task.status} 
                    color={task.status === 'OPEN' ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(task)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  {task.status === 'OPEN' ? (
                    <IconButton size="small" color="warning" onClick={() => closeTaskMutation.mutate(task.id)} title="Close Task">
                      <LockIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <IconButton size="small" color="success" onClick={() => reopenTaskMutation.mutate(task.id)} title="Reopen Task">
                      <LockOpenIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {tasks?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">No tasks found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Task Name"
              fullWidth
              {...register('name', { required: true })}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={2}
              {...register('description')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
