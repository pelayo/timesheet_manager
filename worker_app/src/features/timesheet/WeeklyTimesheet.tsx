import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, Typography, IconButton, Table, TableHead, TableRow, TableCell, 
  TableBody, Paper, TableContainer, TextField 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { startOfWeek, addWeeks, format, parseISO } from 'date-fns';
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

export const WeeklyTimesheet = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  // Assuming week starts on Monday, but backend uses whatever we pass.
  // Let's stick to Monday start for UI consistency if backend supports it.
  // Backend iterates 7 days from weekStart.
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const queryClient = useQueryClient();

  const { data: timesheet, isLoading } = useQuery({
    queryKey: ['timesheet', weekStartStr],
    queryFn: async () => {
      const res = await api.get<TimesheetView>(`/me/timesheet?weekStart=${weekStartStr}`);
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { taskId: string; workDate: string; minutes: number }) => 
      api.put('/me/timesheet/cell', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', weekStartStr] });
    }
  });

  const handlePrevWeek = () => setCurrentDate(addWeeks(currentDate, -1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const handleCellChange = (taskId: string, date: string, value: string) => {
    const minutes = parseInt(value) || 0;
    // Debounce or blur could be better, but for simplicity onBlur is used in TextField
    updateMutation.mutate({ taskId, workDate: date, minutes });
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
                  </TableRow>
                );
            })}
            
            {/* Totals Row */}
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>Daily Totals</TableCell>
                {timesheet?.days.map(day => (
                    <TableCell key={day} align="center" sx={{ fontWeight: 'bold' }}>
                        {timesheet.totalsByDay[day]}
                    </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{timesheet?.totalWeek}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
