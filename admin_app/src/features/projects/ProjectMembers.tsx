import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Box, Typography, TextField, MenuItem, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { api } from '../../api/axios';

interface Member {
  userId: string;
  role: 'MEMBER' | 'LEAD';
  user: {
    email: string;
  };
}

interface User {
  id: string;
  email: string;
}

export const ProjectMembers = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  // Fetch current members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: async () => {
      const res = await api.get<Member[]>(`/admin/projects/${projectId}/members`);
      return res.data;
    }
  });

  // Fetch all users for selection
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<User[]>('/admin/users');
      return res.data;
    },
    enabled: open // Only fetch when dialog opens
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: any) => api.post(`/admin/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      handleClose();
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/projects/${projectId}/members/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] })
  });

  const handleOpen = () => {
    setOpen(true);
    reset();
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = (data: any) => {
    addMemberMutation.mutate(data);
  };

  if (membersLoading) return <div>Loading members...</div>;

  // Filter out users who are already members
  const availableUsers = users?.filter(u => !members?.some(m => m.userId === u.id)) || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Members</Typography>
        <Button variant="contained" size="small" onClick={handleOpen}>Add Member</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member.userId}>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => removeMemberMutation.mutate(member.userId)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {members?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">No members assigned</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Member</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ minWidth: 300 }}>
            {!users ? (
              <CircularProgress />
            ) : (
              <>
                <TextField
                  select
                  margin="dense"
                  label="User"
                  fullWidth
                  defaultValue=""
                  {...register('userId', { required: true })}
                >
                  {availableUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.email}
                    </MenuItem>
                  ))}
                  {availableUsers.length === 0 && <MenuItem disabled>No users available</MenuItem>}
                </TextField>
                
                <TextField
                  select
                  margin="dense"
                  label="Project Role"
                  fullWidth
                  defaultValue="MEMBER"
                  {...register('role')}
                >
                  <MenuItem value="MEMBER">Member</MenuItem>
                  <MenuItem value="LEAD">Lead</MenuItem>
                </TextField>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={availableUsers.length === 0}>Add</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
