import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, Typography, IconButton, Table, TableHead, TableRow, TableCell, 
  TableBody, Paper, TableContainer, TextField, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { startOfWeek, addWeeks, format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { api } from '../../api/axios';

interface TimesheetRow {
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  isClosed: boolean;
  minutesByDay: Record<string, number>;
}

interface TimesheetView {
  weekStart: string;
  days: string[];
  rows: TimesheetRow[];
  totalsByDay: Record<string, number>;
  totalWeek: number;
}

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  status: 'OPEN' | 'CLOSED';
}

export const WeeklyTimesheet = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const { register, handleSubmit, reset } = useForm();

  // Fetch Timesheet
  const { data: timesheet, isLoading } = useQuery({
    queryKey: ['timesheet', weekStartStr],
    queryFn: async () => {
      const res = await api.get<TimesheetView>(`/me/timesheet?weekStart=${weekStartStr}`);
      return res.data;
    }
  });

  // Fetch Projects for Add Dialog
  const { data: projects } = useQuery({
    queryKey: ['myProjects'],
    queryFn: async () => {
      const res = await api.get<Project[]>('/me/projects');
      return res.data;
    },
    enabled: addOpen
  });

  // Fetch Tasks when project selected
  const { data: projectTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['myProjectTasks', selectedProject],
    queryFn: async () => {
      const res = await api.get<Task[]>(`/me/projects/${selectedProject}/tasks`);
      return res.data.filter(t => t.status === 'OPEN'); // Only show OPEN tasks
    },
    enabled: !!selectedProject && addOpen
  });

  const updateMutation = useMutation({
    mutationFn: (data: { taskId: string; workDate: string; minutes: number }) => 
      api.put('/me/timesheet/cell', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', weekStartStr] });
    }
  });

  const pinTaskMutation = useMutation({
    mutationFn: (data: { taskId: string }) => api.post('/me/timesheet/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', weekStartStr] });
      handleAddClose();
    }
  });

  const unpinTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.delete(`/me/timesheet/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', weekStartStr] });
    }
  });

  const handlePrevWeek = () => setCurrentDate(addWeeks(currentDate, -1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const handleCellChange = (taskId: string, date: string, value: string) => {
    const minutes = parseInt(value) || 0;
    updateMutation.mutate({ taskId, workDate: date, minutes });
  };

  const handleAddOpen = () => {
    setAddOpen(true);
    reset();
    setSelectedProject('');
  };

  const handleAddClose = () => {
    setAddOpen(false);
    reset();
    setSelectedProject('');
  };

  const onAddSubmit = (data: any) => {
    pinTaskMutation.mutate({ taskId: data.taskId });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">My Timesheet</Typography>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handlePrevWeek}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            Week of {format(weekStart, 'MMM d, yyyy')}
          </Typography>
          <IconButton onClick={handleNextWeek}><ArrowForwardIcon /></IconButton>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Task</TableCell>
              {timesheet?.days.map(day => (
                <TableCell key={day} align="center">
                  {format(parseISO(day), 'EEE d')}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
              <TableCell align="center"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheet?.rows.map((row) => {
                const rowTotal = Object.values(row.minutesByDay).reduce((a, b) => a + b, 0);
                return (
                  <TableRow key={row.taskId}>
                    <TableCell>{row.projectName}</TableCell>
                    <TableCell>
                        {row.taskName}
                        {row.isClosed && <Typography variant="caption" color="error" display="block">(Closed)</Typography>}
                    </TableCell>
                    {timesheet.days.map(day => (
                      <TableCell key={day} align="center" sx={{ p: 0.5 }}>
                        <TextField
                          type="number"
                          size="small"
                          disabled={row.isClosed}
                          defaultValue={row.minutesByDay[day] === 0 ? '' : row.minutesByDay[day]}
                          onBlur={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              if (val !== row.minutesByDay[day]) {
                                  handleCellChange(row.taskId, day, e.target.value);
                              }
                          }}
                          inputProps={{ min: 0, style: { textAlign: 'center' } }}
                          sx={{ width: 60 }}
                        />
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{rowTotal}</TableCell>
                    <TableCell>
                        <IconButton 
                            size="small" 
                            disabled={rowTotal > 0} 
                            onClick={() => unpinTaskMutation.mutate(row.taskId)}
                            title={rowTotal > 0 ? "Cannot remove active row" : "Remove from view"}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </TableCell>
                  </TableRow>
                );
            })}
            
            <TableRow>
                <TableCell colSpan={10}>
                    <Button startIcon={<AddIcon />} onClick={handleAddOpen}>Add Task Row</Button>
                </TableCell>
            </TableRow>

            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>Daily Totals</TableCell>
                {timesheet?.days.map(day => (
                    <TableCell key={day} align="center" sx={{ fontWeight: 'bold' }}>
                        {timesheet.totalsByDay[day]}
                    </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{timesheet?.totalWeek}</TableCell>
                <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={addOpen} onClose={handleAddClose} fullWidth maxWidth="sm">
        <DialogTitle>Add Task to Timesheet</DialogTitle>
        <form onSubmit={handleSubmit(onAddSubmit)}>
            <DialogContent>
                <TextField
                    select
                    label="Project"
                    fullWidth
                    margin="dense"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                >
                    {projects?.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                </TextField>

                {selectedProject && (
                    tasksLoading ? <CircularProgress size={20} /> : (
                        <TextField
                            select
                            label="Task"
                            fullWidth
                            margin="dense"
                            {...register('taskId', { required: true })}
                        >
                            {projectTasks?.map(t => (
                                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                            ))}
                            {projectTasks?.length === 0 && <MenuItem disabled>No open tasks</MenuItem>}
                        </TextField>
                    )
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleAddClose}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={!selectedProject}>Add</Button>
            </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
