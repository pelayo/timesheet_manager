import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { ProjectsList } from './features/projects/ProjectsList';
import { ProjectDetail } from './features/projects/ProjectDetail';
import { UsersList } from './features/users/UsersList';
import { ReportsPage } from './features/reports/ReportsPage';
import { TimeEntriesPage } from './features/time-entries/TimeEntriesPage';
import { StatsPage } from './features/reports/StatsPage';

const Dashboard = () => <h2>Welcome to Admin Dashboard</h2>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/time-entries" element={<TimeEntriesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;