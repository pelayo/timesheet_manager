import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, Typography, TextField, Button, Paper, MenuItem, FormControl, InputLabel, 
  Select, CircularProgress, Checkbox, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider 
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { api } from '../../api/axios';

const TIME_GROUPS = ['day', 'week', 'month'];
const SERIES_GROUPS = [
  { value: 'none', label: 'None (Total)' },
  { value: 'project', label: 'Project' },
  { value: 'user', label: 'User' },
];

export const StatsPage = () => {
  // Initialize defaults: Last 31 days
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Include today fully
    const thirtyOneDaysAgo = new Date(today);
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    
    return {
        from: thirtyOneDaysAgo.toISOString().split('T')[0],
        to: tomorrow.toISOString().split('T')[0],
        timeGrouping: 'day',
        groupSeriesBy: 'none' 
    };
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      
      params.append('timeGrouping', filters.timeGrouping);
      
      if (filters.groupSeriesBy !== 'none') {
          params.append('groupBy', filters.groupSeriesBy);
      }
      
      const res = await api.get<any[]>('/admin/reports/stats', { params });
      return res.data;
    }
  });

  // Transform data for Recharts
  const { chartData, seriesKeys } = useMemo(() => {
    if (!stats) return { chartData: [], seriesKeys: [] };

    const groupedData: Record<string, any> = {};
    const keys = new Set<string>();

    stats.forEach(item => {
        const period = item.period || 'Total';
        if (!groupedData[period]) {
            groupedData[period] = { name: period };
        }

        let key = 'Total';
        if (filters.groupSeriesBy === 'project') {
            key = item.projectName || 'Unknown Project';
        } else if (filters.groupSeriesBy === 'user') {
            key = item.userEmail || 'Unknown User';
        }

        keys.add(key);
        // Ensure numbers and convert to Hours
        const minutes = Number(item.totalMinutes || 0);
        const hours = Number((minutes / 60).toFixed(2));
        groupedData[period][key] = (groupedData[period][key] || 0) + hours;
    });

    const sortedData = Object.values(groupedData).sort((a, b) => a.name.localeCompare(b.name));
    return { chartData: sortedData, seriesKeys: Array.from(keys) };
  }, [stats, filters.groupSeriesBy]);

  const handleExport = () => {
    if (chartData.length === 0) return;
    
    const headers = ['Period', ...seriesKeys];
    const rows = chartData.map(row => {
        return [
            row.name,
            ...seriesKeys.map(k => row[k] || 0)
        ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const url = window.URL.createObjectURL(new Blob([csv]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stats_graph_export.csv');
    document.body.appendChild(link);
    link.click();
  };

  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const handleToggleSeries = (key: string) => {
    const newHidden = new Set(hiddenSeries);
    if (newHidden.has(key)) {
        newHidden.delete(key);
    } else {
        newHidden.add(key);
    }
    setHiddenSeries(newHidden);
  };

  const handleToggleAll = () => {
      if (hiddenSeries.size === 0) {
          // Hide all
          setHiddenSeries(new Set(seriesKeys));
      } else {
          // Show all
          setHiddenSeries(new Set());
      }
  };

  const allVisible = hiddenSeries.size === 0;
  const someHidden = hiddenSeries.size > 0 && hiddenSeries.size < seriesKeys.length;

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>Statistics</Typography>
      
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
          label="Time Axis (X)"
          value={filters.timeGrouping}
          onChange={(e) => setFilters({ ...filters, timeGrouping: e.target.value })}
          sx={{ minWidth: 150 }}
          slotProps={{ select: { 'data-testid': 'time-axis-select' } as any }}
        >
          {TIME_GROUPS.map(t => (
            <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
          ))}
        </TextField>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="split-series-label">Split Series By</InputLabel>
          <Select
            labelId="split-series-label"
            value={filters.groupSeriesBy}
            label="Split Series By"
            onChange={(e) => {
                setFilters({ ...filters, groupSeriesBy: e.target.value });
                setHiddenSeries(new Set()); // Reset hidden on change
            }}
            data-testid="split-series-select"
          >
            {SERIES_GROUPS.map((g) => (
              <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button variant="contained" color="secondary" onClick={handleExport} disabled={chartData.length === 0}>
          Export CSV
        </Button>
      </Paper>

      {/* Main Chart Area - Flex Layout */}
      <Paper sx={{ height: '75vh', display: 'flex', overflow: 'hidden' }}>
        {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
                <CircularProgress />
            </Box>
        ) : chartData.length > 0 ? (
            <>
                {/* Left Column: Series List */}
                <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                            Series ({seriesKeys.length})
                        </Typography>
                    </Box>
                    <List dense sx={{ overflowY: 'auto', flex: 1 }}>
                        <ListItem disablePadding>
                            <ListItemButton onClick={handleToggleAll} dense>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Checkbox
                                        edge="start"
                                        checked={allVisible}
                                        indeterminate={someHidden}
                                        tabIndex={-1}
                                        disableRipple
                                        size="small"
                                        sx={{ p: 0 }}
                                    />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={allVisible ? "Hide All" : "Show All"} 
                                    primaryTypographyProps={{ fontWeight: 'bold', variant: 'body2' }}
                                />
                            </ListItemButton>
                        </ListItem>
                        <Divider />
                        {seriesKeys.map((key, index) => {
                            const isHidden = hiddenSeries.has(key);
                            const color = colors[index % colors.length];
                            return (
                                <ListItem key={key} disablePadding>
                                    <ListItemButton onClick={() => handleToggleSeries(key)} dense>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Checkbox 
                                                edge="start"
                                                checked={!isHidden}
                                                tabIndex={-1}
                                                disableRipple
                                                size="small"
                                                sx={{ p: 0 }}
                                            />
                                        </ListItemIcon>
                                        <Box 
                                            sx={{ 
                                                width: 12, 
                                                height: 12, 
                                                bgcolor: isHidden ? '#ccc' : color, 
                                                borderRadius: '2px', 
                                                mr: 1 
                                            }} 
                                        />
                                        <ListItemText 
                                            primary={key} 
                                            primaryTypographyProps={{ 
                                                variant: 'body2', 
                                                color: isHidden ? 'text.disabled' : 'text.primary',
                                                noWrap: true
                                            }} 
                                            title={key}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>

                {/* Right Column: Chart */}
                <Box sx={{ flex: 1, p: 2, minWidth: 0, height: '100%' }}>
                    {/* minWidth: 0 is CRITICAL for flex item overflow handling */}
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value: number) => [value + ' h', 'Time']} />
                            {seriesKeys.map((key, index) => (
                                <Bar 
                                    key={key} 
                                    dataKey={key} 
                                    stackId="a" 
                                    fill={colors[index % colors.length]}
                                    hide={hiddenSeries.has(key)}
                                    name={key}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </>
        ) : (
            <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
                <Typography align="center" variant="h6" color="textSecondary">
                    No data available for selected criteria.
                </Typography>
            </Box>
        )}
      </Paper>
    </Box>
  );
};