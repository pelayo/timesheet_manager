import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Box, Typography } from '@mui/material';

interface StatsGraphProps {
  data: { date: string; minutes: number }[];
  title?: string;
  color?: string;
}

export const StatsGraph = ({ data, title = 'Statistics', color = '#8884d8' }: StatsGraphProps) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(item => ({
      date: item.date,
      hours: Number((item.minutes / 60).toFixed(2)),
    }));
  }, [data]);

  if (!data || data.length === 0) {
      return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">No stats data available.</Typography>
          </Box>
      );
  }

  return (
    <Box sx={{ height: 300, width: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: any) => [value + ' h', 'Time']} />
          <Bar dataKey="hours" fill={color} name="Hours" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
