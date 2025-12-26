import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { eachDayOfInterval, format } from 'date-fns';
import { api } from '../../api/axios';

export const ReportsPage = () => {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    if (!filters.from || !filters.to) {
      alert('Please select a date range.');
      return;
    }

    setIsLoading(true);
    
    const start = new Date(filters.from);
    const end = new Date(filters.to);
    const dateRange = eachDayOfInterval({ start, end });

    let allEntries: any[] = [];

    for (const date of dateRange) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const params = new URLSearchParams({ from: dateStr, to: dateStr });
      try {
        const res = await api.get('/admin/reports/time-entries', { params });
        allEntries = allEntries.concat(res.data);
      } catch (error) {
        console.error(`Failed to fetch data for ${dateStr}`, error);
      }
    }

    const header = 'date,userId,userEmail,projectId,projectName,taskId,taskName,minutes,hoursDecimal,notes\n';
    const rows = allEntries.map(e => {
        const hours = (e.minutes / 60).toFixed(2);
        const notes = (e.notes || '').replace(/"/g, '""');
        return `${e.workDate},${e.userId},${e.user.email},${e.task.projectId},${e.task.project.name},${e.taskId},${e.task.name},${e.minutes},${hours},"${notes}"`;
    }).join('\n');
    
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `time-entries-${filters.from}-to-${filters.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsLoading(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reports</Typography>
      
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="From"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <TextField
          label="To"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
        
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleExport}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Export CSV'}
        </Button>
      </Paper>

      <Typography variant="body1">
        Select a date range and click "Export CSV" to download a report of all time entries within that period.
      </Typography>
    </Box>
  );
};
