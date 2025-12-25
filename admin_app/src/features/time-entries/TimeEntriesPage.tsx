import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, Typography, TextField, Paper, Table, TableHead, 
  TableRow, TableCell, TableBody, MenuItem, TablePagination,
  CircularProgress
} from '@mui/material';
import { api } from '../../api/axios';

interface Project {
  id: string;
  name: string;
}

interface TimeEntry {
  id: string;
  workDate: string;
  minutes: number;
  notes: string;
  user: { email: string };
  task: { name: string; project: { name: string } };
}

interface TimeEntryListResponse {
  data: TimeEntry[];
  total: number;
  page: number;
  limit: number;
}

export const TimeEntriesPage = () => {
  const [page, setPage] = useState(0); // MUI uses 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    projectId: ''
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: async () => {
      const res = await api.get<Project[]>('/admin/projects');
      return res.data;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['time-entries', page, rowsPerPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.projectId) params.append('projectId', filters.projectId);
      params.append('page', (page + 1).toString());
      params.append('limit', rowsPerPage.toString());
      
      const res = await api.get<TimeEntryListResponse>('/admin/time-entries', { params });
      return res.data;
    }
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Time Entries</Typography>
      
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="From"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.from}
          onChange={(e) => {
              setFilters({ ...filters, from: e.target.value });
              setPage(0);
          }}
        />
        <TextField
          label="To"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.to}
          onChange={(e) => {
              setFilters({ ...filters, to: e.target.value });
              setPage(0);
          }}
        />
        <TextField
          select
          label="Project"
          value={filters.projectId}
          onChange={(e) => {
              setFilters({ ...filters, projectId: e.target.value });
              setPage(0);
          }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Projects</MenuItem>
          {projects?.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </TextField>
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Task</TableCell>
              <TableCell>Minutes</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center"><CircularProgress /></TableCell>
              </TableRow>
            ) : (
              data?.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.workDate}</TableCell>
                  <TableCell>{entry.user.email}</TableCell>
                  <TableCell>{entry.task.project.name}</TableCell>
                  <TableCell>{entry.task.name}</TableCell>
                  <TableCell>{entry.minutes}</TableCell>
                  <TableCell>{entry.notes}</TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && data?.data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} align="center">No entries found</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.total || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Paper>
    </Box>
  );
};
