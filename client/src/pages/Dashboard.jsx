import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Stat, StatusBadge, money, fmtDate, fmtTime, isStaffRole } from '../components/ui.jsx';

function LatestNews() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get('/announcements', { params: { limit: 4 } }).then((r) => setList(r.data)); }, []);
  return (
    <div className="card mt-3">
      <div className="card-header d-flex justify-content-between align-items-center bg-white">
        <b>Latest announcements & news</b>
        <Link to="/announcements" className="small">View all</Link>
      </div>
      <ul className="list-group list-group-flush">
        {list.map((a) => (
          <li key={a._id} className={`list-group-item ${a.pinned ? 'pinned' : ''}`}>
            <div className="d-flex justify-content-between">
              <b>{a.pinned && '📌 '}{a.title}</b>
              <span className="badge text-bg-light text-capitalize">{a.category}</span>
            </div>
            <div className="text-muted small">{a.body.length > 140 ? a.body.slice(0, 140) + '…' : a.body}</div>
            <small className="text-muted">{fmtDate(a.createdAt)}</small>
          </li>
        ))}
        {list.length === 0 && <li className="list-group-item text-muted text-center">Nothing posted yet.</li>}
      </ul>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const staff = isStaffRole(user.role);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(staff ? '/dashboard/stats' : '/dashboard/me').then((r) => setData(r.data));
  }, [staff]);

  if (!data) return <p className="text-center py-5">Loading...</p>;

  if (staff) {
    const max = Math.max(...data.byDepartment.map((d) => d.count), 1);
    return (
      <>
        <h2 className="h3 mb-3">Dashboard</h2>
        <div className="row g-3">
          <Stat label="Total Employees" value={data.totalEmployees} />
          <Stat label="Active" value={data.activeEmployees} tone="success" />
          <Stat label="Present Today" value={data.presentToday} tone="info" />
          <Stat label="Pending Leaves" value={data.pendingLeaves} tone="warning" />
          <Stat label="Monthly Payroll" value={money(data.monthlyPayroll)} tone="dark" />
        </div>
        <div className="card mt-3">
          <div className="card-body">
            <h3 className="h6">Employees by Department</h3>
            {data.byDepartment.length === 0 && <p className="text-muted">No data yet.</p>}
            {data.byDepartment.map((d) => (
              <div key={d._id} className="d-flex align-items-center gap-3 my-2">
                <span style={{ width: 120 }} className="fw-semibold">{d._id}</span>
                <div className="progress flex-grow-1" style={{ height: 12 }}>
                  <div className="progress-bar" style={{ width: `${(d.count / max) * 100}%` }} />
                </div>
                <small className="text-muted" style={{ width: 160 }}>{d.count} · avg {money(d.avgSalary)}</small>
              </div>
            ))}
          </div>
        </div>
        <LatestNews />
      </>
    );
  }

  const att = data.todayAttendance;
  return (
    <>
      <h2 className="h3 mb-3">Welcome, {user.name} 👋</h2>
      <div className="row g-3">
        <Stat label="My pending leaves" value={data.myPendingLeaves} tone="warning" />
        <Stat label="My approved leaves" value={data.myApprovedLeaves} tone="success" />
        <Stat label="My training programmes" value={data.myTraining} tone="info" />
        <div className="col-6 col-md-3">
          <div className="card h-100 border-primary border-top border-3">
            <div className="card-body">
              <small className="text-muted">Today's attendance</small>
              <div className="mt-1">
                {att ? <>In <b>{fmtTime(att.checkIn)}</b>{att.checkOut && <> · Out <b>{fmtTime(att.checkOut)}</b></>}</> : <StatusBadge value="pending" />}
              </div>
              <Link to="/attendance" className="small">Open attendance</Link>
            </div>
          </div>
        </div>
      </div>

      {user.role === 'manager' && (
        <>
          <h3 className="h5 mt-4">My team</h3>
          <div className="row g-3">
            <Stat label="Team size" value={data.teamSize} />
            <Stat label="Present today" value={data.teamPresentToday} tone="success" />
            <Stat label="Leave requests to review" value={data.teamPendingLeaves} tone="warning" />
            <Stat label="Active training programmes" value={data.activeProgrammes} tone="info" />
          </div>
        </>
      )}
      <LatestNews />
    </>
  );
}
