import { AppBar, Box, Toolbar, Typography, Button, Container } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';

export const Layout = () => {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/user/me');
      return res.data;
    },
    retry: false,
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isPM = user?.role === 'project_manager';

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Timesheet Admin
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Dashboard</Button>
          {!isPM && <Button color="inherit" onClick={() => navigate('/users')}>Users</Button>}
          <Button color="inherit" onClick={() => navigate('/projects')}>Projects</Button>
          {!isPM && <Button color="inherit" onClick={() => navigate('/time-entries')}>Time Entries</Button>}
          {!isPM && <Button color="inherit" onClick={() => navigate('/reports')}>Reports</Button>}
          {!isPM && <Button color="inherit" onClick={() => navigate('/stats')}>Stats</Button>}
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth={false} sx={{ mt: 4, px: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
};
