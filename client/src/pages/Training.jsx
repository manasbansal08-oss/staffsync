import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Alert, StatusBadge, fmtDate, toInput, isStaffRole } from '../components/ui.jsx';

const blank = { title: '', description: '', mode: 'online', startDate: '', endDate: '', status: 'planned', participants: [] };

export default function Training() {
  const { user } = useAuth();
  const canManage = isStaffRole(user.role) || user.role === 'manager';
  const [list, setList] = useState([]);
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/training').then((r) => setList(r.data));
  useEffect(() => {
    load();
    if (user.role === 'manager') api.get('/employees/team').then((r) => setPeople(r.data));
    else if (isStaffRole(user.role)) api.get('/employees').then((r) => setPeople(r.data));
  }, []);

  const open = (t) => {
    setError('');
    setEditId(t ? t._id : null);
    setForm(t ? {
      title: t.title, description: t.description, mode: t.mode, status: t.status,
      startDate: toInput(t.startDate), endDate: toInput(t.endDate), participants: t.participants.map((p) => p._id),
    } : blank);
    setShow(true);
  };

  const toggleP = (id) =>
    setForm((f) => ({ ...f, participants: f.participants.includes(id) ? f.participants.filter((p) => p !== id) : [...f.participants, id] }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api.put(`/training/${editId}`, form);
      else await api.post('/training', form);
      setShow(false);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this training programme?')) return;
    try { await api.delete(`/training/${id}`); load(); } catch (err) { alert(errMsg(err)); }
  };

  // a manager can only edit programmes they own; HR/admin can edit all
  const editable = (t) => isStaffRole(user.role) || t.manager?._id === user.employee;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="h3 m-0">Training & Development</h2>
        {canManage && <button className="btn btn-primary" onClick={() => open(null)}>+ New programme</button>}
      </div>

      {show && (
        <form className="card card-body mb-3" onSubmit={save}>
          <h3 className="h5">{editId ? 'Edit programme' : 'New programme'}</h3>
          <Alert>{error}</Alert>
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label">Title</label><input className="form-control" required value={form.title} onChange={set('title')} /></div>
            <div className="col-md-3">
              <label className="form-label">Mode</label>
              <select className="form-select" value={form.mode} onChange={set('mode')}>
                <option value="online">Online</option><option value="classroom">Classroom</option>
                <option value="workshop">Workshop</option><option value="self-paced">Self-paced</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                <option value="planned">Planned</option><option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-3"><label className="form-label">Start</label><input className="form-control" type="date" required value={form.startDate} onChange={set('startDate')} /></div>
            <div className="col-md-3"><label className="form-label">End</label><input className="form-control" type="date" required value={form.endDate} onChange={set('endDate')} /></div>
            <div className="col-md-6"><label className="form-label">Description</label><input className="form-control" value={form.description} onChange={set('description')} /></div>
            <div className="col-12">
              <label className="form-label">Participants {user.role === 'manager' && <small className="text-muted">(your team)</small>}</label>
              <div className="border rounded p-2 bg-white" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {people.map((p) => (
                  <div className="form-check" key={p._id}>
                    <input id={`p-${p._id}`} type="checkbox" className="form-check-input" checked={form.participants.includes(p._id)} onChange={() => toggleP(p._id)} />
                    <label className="form-check-label" htmlFor={`p-${p._id}`}>{p.name} <small className="text-muted">· {p.designation}</small></label>
                  </div>
                ))}
                {people.length === 0 && <small className="text-muted">No team members available.</small>}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="row g-3">
        {list.map((t) => (
          <div className="col-md-6" key={t._id}>
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <h3 className="h5">{t.title}</h3>
                  <StatusBadge value={t.status} />
                </div>
                <p className="text-muted mb-2">{t.description || 'No description'}</p>
                <div className="small mb-2">
                  <span className="badge text-bg-light text-capitalize me-2">{t.mode}</span>
                  {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
                  {t.manager && <> · by {t.manager.name}</>}
                </div>
                <div className="small"><b>Participants ({t.participants.length}):</b> {t.participants.map((p) => p.name).join(', ') || '—'}</div>
              </div>
              {canManage && editable(t) && (
                <div className="card-footer bg-white">
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => open(t)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(t._id)}>Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-muted py-4">No training programmes yet.</p>}
      </div>
    </>
  );
}
