import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
<<<<<<< HEAD
import Signup from './pages/Signup.jsx';
=======
>>>>>>> 6d039a0ca1ca41a25886084f488f0831548c0a2b
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Team from './pages/Team.jsx';
import Leaves from './pages/Leaves.jsx';
import Attendance from './pages/Attendance.jsx';
import Announcements from './pages/Announcements.jsx';
import Training from './pages/Training.jsx';
import Profile from './pages/Profile.jsx';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center py-5">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <main className="container py-4">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
<<<<<<< HEAD
          <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
=======
>>>>>>> 6d039a0ca1ca41a25886084f488f0831548c0a2b
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/employees" element={<Protected roles={['admin', 'hr']}><Employees /></Protected>} />
          <Route path="/team" element={<Protected roles={['manager']}><Team /></Protected>} />
          <Route path="/leaves" element={<Protected><Leaves /></Protected>} />
          <Route path="/attendance" element={<Protected><Attendance /></Protected>} />
          <Route path="/training" element={<Protected><Training /></Protected>} />
          <Route path="/announcements" element={<Protected><Announcements /></Protected>} />
          <Route path="/profile" element={<Protected roles={['hr', 'manager', 'employee']}><Profile /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
