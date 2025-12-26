import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, Typography, Paper, Tabs, Tab, Button, CircularProgress,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { api } from '../../api/axios';
import { ProjectTasks } from './ProjectTasks';
import { ProjectMembers } from './ProjectMembers';
import { StatsGraph } from '../../components/StatsGraph';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  isArchived: boolean;
  isGlobal: boolean;
}

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [groupBy, setGroupBy] = useState('day');
  
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

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const res = await api.get<Project>(`/admin/projects/${projectId}`);
      return res.data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['project-stats', projectId, filters, groupBy],
    enabled: !!projectId,
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      params.append('groupBy', groupBy);
      const res = await api.get<any[]>(`/admin/reports/project/${projectId}/stats`, { params });
      return res.data;
    }
  });

  const { chartData, seriesKeys } = useMemo(() => {
    if (!stats) return { chartData: [], seriesKeys: [] };

    const keys = new Set<string>();
    stats.forEach(item => keys.add(item.userEmail || 'Unknown'));
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
                const seriesKey = item.userEmail || 'Unknown';
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
  if (!project) return <div>Project not found</div>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mb: 2 }}>
        Back to Projects
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {project.name} <Typography component="span" color="textSecondary">({project.code})</Typography>
        </Typography>
        <Typography variant="body1" paragraph>{project.description}</Typography>
        <Box display="flex" gap={2}>
          <Typography variant="caption" display="block">
            Status: {project.isArchived ? 'Archived' : 'Active'}
          </Typography>
          <Typography variant="caption" display="block">
            Type: {project.isGlobal ? 'Global' : 'Assigned'}
          </Typography>
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
            title="Project Activity (Daily by User)"
            filters={filters}
            onFilterChange={setFilters}
          />
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Tasks" />
          <Tab label="Members" />
        </Tabs>
      </Box>

      {tab === 0 && <ProjectTasks />}
      {tab === 1 && <ProjectMembers />}
    </Box>
  );
};
