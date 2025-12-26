import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Box, Typography, TextField, FormControlLabel, Checkbox,
  List, ListItem, ListSubheader, Paper
} from '@mui/material';
import { format, parseISO } from 'date-fns';

interface StatsGraphProps {
  chartData: any[];
  seriesKeys: string[];
  title?: string;
  filters: { from: string; to: string };
  onFilterChange: (filters: { from: string; to: string }) => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

interface SeriesSelectorProps {
  series: string[];
  visibleSeries: string[];
  onToggle: (key: string) => void;
  colors: string[];
}

const SeriesSelector = ({ series, visibleSeries, onToggle, colors }: SeriesSelectorProps) => (
  <Paper variant="outlined" sx={{ maxHeight: 300, overflowY: 'auto' }}>
    <List dense subheader={<ListSubheader>Series</ListSubheader>}>
      {series.map((key: string, index: number) => (
        <ListItem key={key} dense>
          <FormControlLabel
            control={
              <Checkbox
                checked={visibleSeries.includes(key)}
                onChange={() => onToggle(key)}
                size="small"
              />
            }
            label={
              <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 12, height: 12, bgcolor: colors[index % colors.length], mr: 1 }} />
                {key}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  </Paper>
);


export const StatsGraph = ({ chartData, seriesKeys, title = 'Statistics', filters, onFilterChange }: StatsGraphProps) => {
  const [visibleSeries, setVisibleSeries] = useState<string[]>(seriesKeys);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setVisibleSeries(seriesKeys);
  }, [seriesKeys]);
  
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSeriesToggle = (key: string) => {
    if (visibleSeries.includes(key)) {
      setVisibleSeries(visibleSeries.filter(s => s !== key));
    } else {
      setVisibleSeries([...visibleSeries, key]);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      // Handles 'YYYY-MM-DD' and full ISO strings
      const date = parseISO(dateStr);
      return format(date, 'dd-MM-yyyy');
    } catch (e) {
      return dateStr;
    }
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <Typography variant="h6">{title}</Typography>
          <Box display="flex" gap={2}>
            <TextField
                label="From"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={localFilters.from}
                onChange={(e) => setLocalFilters({ ...localFilters, from: e.target.value })}
                onBlur={() => onFilterChange(localFilters)}
            />
            <TextField
                label="To"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={localFilters.to}
                onChange={(e) => setLocalFilters({ ...localFilters, to: e.target.value })}
                onBlur={() => onFilterChange(localFilters)}
            />
          </Box>
      </Box>
      
      <Box display="flex" gap={2}>
        <Box sx={{ height: 300, flex: 1 }}>
          {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value: any) => [value + ' h', 'Time']} 
                    labelFormatter={formatDate}
                  />
                  <Legend wrapperStyle={{ display: 'none' }} />
                  {seriesKeys.map((key, index) => (
                    visibleSeries.includes(key) &&
                      <Bar 
                          key={key} 
                          dataKey={key} 
                          stackId="a" 
                          fill={COLORS[index % COLORS.length]} 
                          name={key} 
                      />
                  ))}
                  </BarChart>
              </ResponsiveContainer>
          ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography variant="body2" color="textSecondary">No data available.</Typography>
              </Box>
          )}
        </Box>
        <Box>
            <SeriesSelector 
              series={seriesKeys}
              visibleSeries={visibleSeries}
              onToggle={handleSeriesToggle}
              colors={COLORS}
            />
        </Box>
      </Box>
    </Box>
  );
};
