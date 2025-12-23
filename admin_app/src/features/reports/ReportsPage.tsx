import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, Typography, TextField, Button, Paper, Table, TableHead, 
  TableRow, TableCell, TableBody, MenuItem, TableContainer 
} from '@mui/material';
import { api } from '../../api/axios';

export const ReportsPage = () => {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    groupBy: ''
  });

  const { data: report } = useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.groupBy) params.append('groupBy', filters.groupBy);
      
      const res = await api.get('/admin/reports/time-entries', { params });
      return res.data;
    }
  });

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    
    const res = await api.get('/admin/reports/time-entries/export', { 
      params, 
      responseType: 'blob' 
    });
    
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'time-entries.csv');
    document.body.appendChild(link);
    link.click();
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
        <TextField
          select
          label="Group By"
          value={filters.groupBy}
          onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">None</MenuItem>
          <MenuItem value="project">Project</MenuItem>
          <MenuItem value="user">User</MenuItem>
          <MenuItem value="day">Day</MenuItem>
        </TextField>
        
        <Button variant="contained" color="secondary" onClick={handleExport}>
          Export CSV
        </Button>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {filters.groupBy ? (
                <>
                  <TableCell>Group</TableCell>
                  <TableCell>Total Minutes</TableCell>
                </>
              ) : (
                <>
                  <TableCell>Date</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Task</TableCell>
                  <TableCell>Minutes</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {report?.map((row: any, i: number) => (
              <TableRow key={i}>
                {filters.groupBy ? (
                  <>
                    <TableCell>{row.group}</TableCell>
                    <TableCell>{row.totalMinutes}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{row.workDate}</TableCell>
                    <TableCell>{row.user?.email}</TableCell>
                    <TableCell>{row.task?.name}</TableCell>
                    <TableCell>{row.minutes}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
