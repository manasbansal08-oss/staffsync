import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Alert, fmtTime, isStaffRole } from '../components/ui.jsx';

const hours = (a, b) => (a && b ? ((new Date(b) - new Date(a)) / 36e5).toFixed(1) + ' h' : '—');

export default function Attendance() {
  const { user } = useAuth();
  const staff = isStaffRole(user.role);
  const canMark = !staff; // employees and managers mark their own attendance
  const showWho = staff || user.role === 'manager';
  const [list, setList] = useState([]);
  const [date, setDate] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get('/attendance', { params: date ? { date } : {} }).then((r) => setList(r.data));
  useEffect(() => { load(); }, [date]);

  const mark = async (kind) => {
    setMsg('');
    try {
      await api.post(`/attendance/${kind}`);
      load();
    } catch (err) {
      setMsg(errMsg(err));
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="h3 m-0">Attendance</h2>
        <div className="d-flex gap-2 align-items-center">
          {showWho && (
            <>
              <input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {date && <button className="btn btn-sm btn-outline-secondary" onClick={() => setDate('')}>Clear</button>}
            </>
          )}
          {canMark && (
            <>
              <button className="btn btn-primary text-nowrap" onClick={() => mark('check-in')}>Check In</button>
              <button className="btn btn-outline-primary text-nowrap" onClick={() => mark('check-out')}>Check Out</button>
            </>
          )}
        </div>
      </div>
      <Alert>{msg}</Alert>
      {user.role === 'manager' && <p className="text-muted small">Showing your attendance and your team's.</p>}

      <div className="card table-responsive">
        <table className="table mb-0">
          <thead><tr>{showWho && <th>Employee</th>}<th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r._id}>
                {showWho && <td><b>{r.employee?.name}</b><br /><small className="text-muted">{r.employee?.department}</small></td>}
                <td>{r.date}</td>
                <td>{fmtTime(r.checkIn)}</td>
                <td>{fmtTime(r.checkOut)}</td>
                <td>{hours(r.checkIn, r.checkOut)}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="5" className="text-center text-muted">No records</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
