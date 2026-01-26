import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Button, Paper, CircularProgress, Divider } from '@mui/material';
import { eachDayOfInterval, format } from 'date-fns';
import { api } from '../../api/axios';
import { DateInput } from '../../components/DateInput';

export const ReportsPage = () => {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { data: chargeableSummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['chargeable-summary', filters],
    enabled: Boolean(filters.from && filters.to),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      const res = await api.get('/admin/reports/chargeable-summary', { params });
      return res.data as { chargeableMinutes: number; nonChargeableMinutes: number };
    },
  });

  const chargeableMinutes = chargeableSummary?.chargeableMinutes ?? 0;
  const nonChargeableMinutes = chargeableSummary?.nonChargeableMinutes ?? 0;
  const chargeableHours = (chargeableMinutes / 60).toFixed(2);
  const nonChargeableHours = (nonChargeableMinutes / 60).toFixed(2);

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
        <DateInput
          label="From"
          value={filters.from}
          onChange={(value) => setFilters({ ...filters, from: value })}
        />
        <DateInput
          label="To"
          value={filters.to}
          onChange={(value) => setFilters({ ...filters, to: value })}
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

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Chargeable Summary</Typography>
        {!filters.from || !filters.to ? (
          <Typography variant="body2" color="textSecondary">
            Select a date range to view chargeable vs non-chargeable totals.
          </Typography>
        ) : isSummaryLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="textSecondary">Chargeable</Typography>
              <Typography variant="h6">{chargeableHours} hrs</Typography>
              <Typography variant="body2" color="textSecondary">{chargeableMinutes} minutes</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="textSecondary">Non-chargeable</Typography>
              <Typography variant="h6">{nonChargeableHours} hrs</Typography>
              <Typography variant="body2" color="textSecondary">{nonChargeableMinutes} minutes</Typography>
            </Box>
          </Box>
        )}
      </Paper>

      <Typography variant="body1">
        Select a date range and click "Export CSV" to download a report of all time entries within that period.
      </Typography>
    </Box>
  );
};
