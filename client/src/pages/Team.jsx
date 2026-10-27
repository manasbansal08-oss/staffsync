import { useEffect, useState } from 'react';
import api from '../api';
import { StatusBadge, fmtDate } from '../components/ui.jsx';

export default function Team() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get('/employees/team').then((r) => setList(r.data)); }, []);

  return (
    <>
      <h2 className="h3 mb-3">My Team</h2>
      <div className="card table-responsive">
        <table className="table table-hover mb-0">
          <thead><tr><th>Name</th><th>Department</th><th>Designation</th><th>Phone</th><th>Joined</th><th>Status</th></tr></thead>
          <tbody>
            {list.map((e) => (
              <tr key={e._id}>
                <td><b>{e.name}</b><br /><small className="text-muted">{e.email}</small></td>
                <td>{e.department}</td>
                <td>{e.designation}</td>
                <td>{e.phone || '—'}</td>
                <td>{fmtDate(e.joiningDate)}</td>
                <td><StatusBadge value={e.status} /></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="6" className="text-center text-muted">No one reports to you yet. HR can assign team members.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
