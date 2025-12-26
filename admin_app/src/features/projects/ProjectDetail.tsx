import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, Typography, Paper, Tabs, Tab, Button, CircularProgress
} from '@mui/material';
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

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const res = await api.get<Project>(`/admin/projects/${projectId}`);
      return res.data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['project-stats', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await api.get<any[]>(`/admin/reports/project/${projectId}/stats`);
      return res.data;
    }
  });

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
      
      {stats && (
          <Paper sx={{ mb: 3 }}>
              <StatsGraph data={stats} title="Project Activity (Daily)" />
          </Paper>
      )}

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
