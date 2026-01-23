import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, Typography, Paper, Button, CircularProgress,
  ToggleButtonGroup, ToggleButton, TextField
} from '@mui/material';
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { api } from '../../api/axios';
import { StatsGraph } from '../../components/StatsGraph';

interface User {
  id: string;
  email: string;
  role: string;
  standardHours: number | null;
}

export const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [groupBy, setGroupBy] = useState('day');
  const [standardHours, setStandardHours] = useState('');
  
  const [filters, setFilters] = useState(() => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
          from: thirtyDaysAgo.toISOString().split('T')[0],
          to: tomorrow.toISOString().split('T')[0],
      };
  });

  const { data: user, isLoading } = useQuery({
      queryKey: ['user', userId],
      queryFn: async () => {
          const res = await api.get<User>(`/admin/users/${userId}`);
          return res.data;
      }
  });

  useEffect(() => {
    if (user) {
      setStandardHours(user.standardHours !== null ? String(user.standardHours) : '')
    }
  }, [user]);

  const updateStandardHoursMutation = useMutation({
    mutationFn: (hours: number) =>
      api.patch(`/admin/users/${userId}`, { standardHours: hours }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

   const { data: stats } = useQuery({
    queryKey: ['worker-stats', userId, filters, groupBy],
    enabled: !!userId,
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      params.append('groupBy', groupBy);
      const res = await api.get<any[]>(`/admin/reports/worker/${userId}/stats`, { params });
      return res.data;
    }
  });

  const { chartData, seriesKeys } = useMemo(() => {
    if (!stats) return { chartData: [], seriesKeys: [] };

    const keys = new Set<string>();
    stats.forEach(item => keys.add(item.projectName || 'Unknown'));
    const seriesKeys = Array.from(keys);
    
    let allDatesInRange: Date[] = [];
    const start = new Date(filters.from);
    const end = new Date(filters.to);
    
    if (groupBy === 'day') {
      allDatesInRange = eachDayOfInterval({ start, end });
    } else if (groupBy === 'week') {
      allDatesInRange = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    } else if (groupBy === 'month') {
      allDatesInRange = eachMonthOfInterval({ start, end });
    }

    const finalChartData = allDatesInRange.map(date => {
        const grouped: Record<string, any> = { date: date.toISOString().split('T')[0] };
        seriesKeys.forEach(key => grouped[key] = 0);

        let dateMatcher: (statDate: Date, rangeDate: Date) => boolean;
        if (groupBy === 'day') {
          dateMatcher = isSameDay;
        } else if (groupBy === 'week') {
          dateMatcher = isSameWeek;
        } else {
          dateMatcher = isSameMonth;
        }

        stats.filter(s => dateMatcher(new Date(s.date), date))
             .forEach(item => {
                const seriesKey = item.projectName || 'Unknown';
                const hours = Number((item.minutes / 60).toFixed(2));
                grouped[seriesKey] = (grouped[seriesKey] || 0) + hours;
             });
        
        return grouped;
    });

    return { 
        chartData: finalChartData,
        seriesKeys: Array.from(keys) 
    };
  }, [stats, filters.from, filters.to, groupBy]);

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
              <Box display="flex" alignItems="center" gap={2} mt={2}>
                <TextField
                  label="Standard Hours (weekly)"
                  type="number"
                  size="small"
                  value={standardHours}
                  onChange={(event) => setStandardHours(event.target.value)}
                  inputProps={{ min: 0, max: 168, step: 0.25 }}
                />
                <Button
                  variant="contained"
                  disabled={
                    updateStandardHoursMutation.isPending ||
                    standardHours === '' ||
                    Number.isNaN(Number(standardHours)) ||
                    (user.standardHours !== null &&
                      Number(standardHours) === Number(user.standardHours))
                  }
                  onClick={() =>
                    updateStandardHoursMutation.mutate(Number(standardHours))
                  }
                >
                  Save Standard Hours
                </Button>
              </Box>
          </Paper>

           <Paper sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="flex-end" sx={{ p: 1 }}>
                  <ToggleButtonGroup
                    value={groupBy}
                    exclusive
                    size="small"
                    onChange={(_, newValue) => {
                      if (newValue) setGroupBy(newValue);
                    }}
                  >
                    <ToggleButton value="day">Day</ToggleButton>
                    <ToggleButton value="week">Week</ToggleButton>
                    <ToggleButton value="month">Month</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <StatsGraph 
                    chartData={chartData} 
                    seriesKeys={seriesKeys}
                    title="Worker Activity (Daily by Project)" 
                    filters={filters}
                    onFilterChange={setFilters}
                />
            </Paper>
      </Box>
  );
};
