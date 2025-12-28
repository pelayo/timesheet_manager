import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, Box, Typography, Dialog, DialogTitle, DialogContent, TextField, 
  DialogActions, MenuItem, IconButton, TablePagination, InputAdornment 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from 'react-hook-form';
import { api } from '../../api/axios';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'project_manager';
}

interface UsersResponse {
    items: User[];
    total: number;
}

export const UsersList = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { register, handleSubmit, reset } = useForm();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit } = useForm();

  // Pagination & Search state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, rowsPerPage, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
          page: (page + 1).toString(),
          limit: rowsPerPage.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);

      const res = await api.get<UsersResponse>('/admin/users', { params });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const users = data?.items || [];
  const totalCount = data?.total || 0;

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, role: string }) => api.patch(`/admin/users/${data.id}`, { role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleEditClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleOpen = () => {
    setOpen(true);
    reset();
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleEditOpen = (user: User) => {
    setEditingUser(user);
    resetEdit({ role: user.role });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingUser(null);
    resetEdit();
  };

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (editingUser) {
        updateMutation.mutate({ id: editingUser.id, role: data.role });
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
        <Typography variant="h4">Users</Typography>
        <Button variant="contained" onClick={handleOpen}>Add User</Button>
      </Box>

      <Box mb={2}>
        <TextField
          label="Search Users"
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
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link to={`/users/${user.id}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
                    {user.email}
                  </Link>
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEditOpen(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => deleteMutation.mutate(user.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
               <TableRow>
                 <TableCell colSpan={3} align="center">No users found</TableCell>
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
        <DialogTitle>New User</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              {...register('email', { required: true })}
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              {...register('password', { required: true })}
            />
            <TextField
              select
              margin="dense"
              label="Role"
              fullWidth
              defaultValue="user"
              {...register('role')}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="project_manager">Project Manager</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>Edit User Role</DialogTitle>
        <form onSubmit={handleSubmitEdit(onEditSubmit)}>
          <DialogContent>
            <TextField
              margin="dense"
              label="Email"
              fullWidth
              disabled
              value={editingUser?.email || ''}
            />
            <TextField
              select
              margin="dense"
              label="Role"
              fullWidth
              defaultValue={editingUser?.role}
              {...registerEdit('role')}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="project_manager">Project Manager</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button type="submit" variant="contained">Update</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
