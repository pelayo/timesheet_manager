import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, Box, Typography, Dialog, DialogTitle, DialogContent, TextField, 
  DialogActions, FormControlLabel, Checkbox, TablePagination, InputAdornment 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from 'react-hook-form';
import { api } from '../../api/axios';

import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  isArchived: boolean;
  isGlobal: boolean;
}

interface ProjectsResponse {
  items: Project[];
  total: number;
}

export const ProjectsList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();
  
  // Pagination & Search state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, rowsPerPage, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await api.get<ProjectsResponse>('/admin/projects', { params });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const projects = data?.items || [];
  const totalCount = data?.total || 0;

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/admin/projects/${editingProject?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleClose();
    }
  });

  const handleOpen = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setValue('name', project.name);
      setValue('code', project.code);
      setValue('description', project.description);
      setValue('isArchived', project.isArchived);
      setValue('isGlobal', project.isGlobal);
    } else {
      setEditingProject(null);
      reset();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProject(null);
    reset();
  };

  const onSubmit = (data: any) => {
    if (editingProject) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading && !data) return <div>Loading...</div>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projects</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>Add Project</Button>
      </Box>

      <Box mb={2}>
        <TextField
          label="Search Projects"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.code}</TableCell>
                <TableCell>{project.isArchived ? 'Archived' : 'Active'}</TableCell>
                <TableCell>{project.isGlobal ? 'Global' : 'Assigned'}</TableCell>
                <TableCell align="right">
                  <Button onClick={() => navigate(`/projects/${project.id}`)} sx={{ mr: 1 }}>Manage</Button>
                  <Button onClick={() => handleOpen(project)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
               <TableRow>
                 <TableCell colSpan={5} align="center">No projects found</TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Name"
              fullWidth
              {...register('name', { required: true })}
            />
            <TextField
              margin="dense"
              label="Code"
              fullWidth
              {...register('code')}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              {...register('description')}
            />
            <FormControlLabel
              control={<Checkbox defaultChecked={editingProject ? editingProject.isGlobal : false} {...register('isGlobal')} />}
              label="Global (Available to everyone)"
            />
            {editingProject && (
              <FormControlLabel
                control={<Checkbox defaultChecked={editingProject.isArchived} {...register('isArchived')} />}
                label="Archived"
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
