import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, Typography, TextField, Button, Paper, MenuItem, FormControl, InputLabel, 
  Select, CircularProgress 
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { api } from '../../api/axios';

const TIME_GROUPS = ['day', 'week', 'month'];
const SERIES_GROUPS = [
  { value: 'none', label: 'None (Total)' },
  { value: 'project', label: 'Project' },
  { value: 'user', label: 'User' },
];

export const StatsPage = () => {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    timeGrouping: 'day',
    groupSeriesBy: 'project' // 'project' | 'user' | 'none'
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
        // Ensure numbers
        groupedData[period][key] = (groupedData[period][key] || 0) + Number(item.totalMinutes || 0);
    });

    const sortedData = Object.values(groupedData).sort((a, b) => a.name.localeCompare(b.name));
    return { chartData: sortedData, seriesKeys: Array.from(keys) };
  }, [stats, filters.groupSeriesBy]);

  const handleExport = () => {
    // Generate CSV from chartData (pivoted)
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

  

    const handleLegendClick = (e: any) => {

      const { value } = e;

      const newHidden = new Set(hiddenSeries);

      if (newHidden.has(value)) {

          newHidden.delete(value);

      } else {

          newHidden.add(value);

      }

      setHiddenSeries(newHidden);

    };

  

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

  

    return (

      <Box>

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

  

        <Paper sx={{ p: 2, height: 500 }}>

          {isLoading ? (

              <Box display="flex" justifyContent="center" alignItems="center" height="100%">

                  <CircularProgress />

              </Box>

          ) : chartData.length > 0 ? (

              <ResponsiveContainer width="100%" height="100%">

                  <BarChart data={chartData}>

                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis dataKey="name" />

                      <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />

                      <Tooltip />

                      <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />

                      {seriesKeys.map((key, index) => (

                          <Bar 

                              key={key} 

                              dataKey={key} 

                              stackId="a" 

                              fill={colors[index % colors.length]} 

                              hide={hiddenSeries.has(key)}

                              name={key} // Explicitly set name for legend

                          />

                      ))}

                  </BarChart>

              </ResponsiveContainer>

          ) : (

              <Typography align="center" mt={10}>No data available for selected criteria.</Typography>

          )}

        </Paper>

      </Box>

    );

  };

  