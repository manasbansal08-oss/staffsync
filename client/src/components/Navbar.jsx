import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isStaff = user.role === 'admin' || user.role === 'hr';
  const close = () => setOpen(false);
  const link = (to, label, end) => (
    <li className="nav-item"><NavLink className="nav-link" to={to} end={end} onClick={close}>{label}</NavLink></li>
  );

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <span className="navbar-brand fw-bold brand">Staff<span>Sync</span></span>
        <button className="navbar-toggler" type="button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto">
            {link('/', 'Dashboard', true)}
            {isStaff && link('/employees', 'Employees')}
            {user.role === 'manager' && link('/team', 'My Team')}
            {link('/leaves', 'Leaves')}
            {link('/attendance', 'Attendance')}
            {link('/training', 'Training')}
            {link('/announcements', 'Announcements')}
            {user.role !== 'admin' && link('/profile', 'My Profile')}
          </ul>
          <div className="d-flex align-items-center gap-2 text-light">
            <span>{user.name} <span className="badge text-bg-primary text-uppercase">{user.role}</span></span>
            <button className="btn btn-sm btn-outline-light" onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
