import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { WeeklyTimesheet } from './features/timesheet/WeeklyTimesheet';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<WeeklyTimesheet />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;