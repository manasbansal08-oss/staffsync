import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Alert, StatusBadge, fmtDate, isStaffRole } from '../components/ui.jsx';

const blank = { type: 'casual', fromDate: '', toDate: '', reason: '' };

export default function Leaves() {
  const { user } = useAuth();
  const staff = isStaffRole(user.role);
  const isManager = user.role === 'manager';
  const canApply = !staff;
  const [list, setList] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const load = () => api.get('/leaves').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const apply = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/leaves', form);
      setForm(blank);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const review = async (id, status) => {
    const note = window.prompt(`Optional note for the employee (${status}):`, '') ?? '';
    try {
      await api.patch(`/leaves/${id}/status`, { status, note });
      load();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  // a manager sees two lists: requests from the team (to review) and their own
  const own = (l) => isManager && l.employee?._id === user.employee;
  const reviewList = staff ? list : isManager ? list.filter((l) => !own(l)) : [];
  const myList = staff ? [] : isManager ? list.filter(own) : list;

  const Table = ({ rows, canReview }) => (
    <div className="card table-responsive mb-4">
      <table className="table mb-0">
        <thead><tr>{(canReview) && <th>Employee</th>}<th>Type</th><th>Dates</th><th>Reason</th><th>Status</th>{canReview && <th></th>}</tr></thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l._id}>
              {canReview && <td><b>{l.employee?.name}</b><br /><small className="text-muted">{l.employee?.department}</small></td>}
              <td className="text-capitalize">{l.type}</td>
              <td>{fmtDate(l.fromDate)} → {fmtDate(l.toDate)}</td>
              <td>{l.reason}{l.reviewNote && <><br /><small className="text-muted">Note: {l.reviewNote}</small></>}</td>
              <td><StatusBadge value={l.status} /></td>
              {canReview && (
                <td className="text-nowrap">
                  {l.status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-success me-1" onClick={() => review(l._id, 'approved')}>Approve</button>
                      <button className="btn btn-sm btn-danger" onClick={() => review(l._id, 'rejected')}>Reject</button>
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan="6" className="text-center text-muted">No leave requests</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <h2 className="h3 mb-3">Leave Requests</h2>

      {canApply && (
        <form className="card card-body mb-4" onSubmit={apply}>
          <h3 className="h5">Apply for leave</h3>
          <Alert>{error}</Alert>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
                <option value="earned">Earned</option>
              </select>
            </div>
            <div className="col-md-4"><label className="form-label">From</label><input className="form-control" type="date" required value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} /></div>
            <div className="col-md-4"><label className="form-label">To</label><input className="form-control" type="date" required value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} /></div>
            <div className="col-12"><label className="form-label">Reason</label><textarea className="form-control" required rows="2" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          </div>
          <div><button className="btn btn-primary mt-3">Submit request</button></div>
        </form>
      )}

      {(staff || isManager) && (
        <>
          <h3 className="h5">{staff ? 'All requests' : 'Team requests to review'}</h3>
          <Table rows={reviewList} canReview />
        </>
      )}
      {!staff && (
        <>
          {isManager && <h3 className="h5">My requests</h3>}
          <Table rows={myList} canReview={false} />
          {isManager && <p className="text-muted small">Your own requests are approved by HR.</p>}
        </>
      )}
    </>
  );
}
