import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { api } from '../../api/axios';
import { StatsGraph } from '../../components/StatsGraph';

interface User {
  id: string;
  email: string;
  role: string;
}

export const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const { data: user, isLoading } = useQuery({
      queryKey: ['user', userId],
      queryFn: async () => {
          const res = await api.get<User>(`/admin/users/${userId}`);
          return res.data;
      }
  });

   const { data: stats } = useQuery({
    queryKey: ['worker-stats', userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get<any[]>(`/admin/reports/worker/${userId}/stats`);
      return res.data;
    }
  });

  if (isLoading) return <CircularProgress />;
  if (!user) return <div>User not found</div>;

  return (
      <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')} sx={{ mb: 2 }}>
            Back to Users
          </Button>
          <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h4">{user.email}</Typography>
              <Typography variant="subtitle1" color="textSecondary">Role: {user.role}</Typography>
          </Paper>

           {stats && (
            <Paper sx={{ mb: 3 }}>
                <StatsGraph data={stats} title="Worker Activity (Daily)" color="#82ca9d" />
            </Paper>
          )}
      </Box>
  );
};
