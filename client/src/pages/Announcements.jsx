import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Alert, fmtDate, isStaffRole } from '../components/ui.jsx';

const blank = { title: '', body: '', category: 'announcement', pinned: false };
const catTone = { announcement: 'primary', news: 'info', policy: 'warning', event: 'success' };

export default function Announcements() {
  const { user } = useAuth();
  const canPost = isStaffRole(user.role);
  const [list, setList] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/announcements', { params: filter ? { category: filter } : {} }).then((r) => setList(r.data));
  useEffect(() => { load(); }, [filter]);

  const open = (a) => {
    setError('');
    setEditId(a ? a._id : null);
    setForm(a ? { title: a.title, body: a.body, category: a.category, pinned: a.pinned } : blank);
    setShow(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api.put(`/announcements/${editId}`, form);
      else await api.post('/announcements', form);
      setShow(false);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    await api.delete(`/announcements/${id}`);
    load();
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="h3 m-0">Announcements & News</h2>
        <div className="d-flex gap-2">
          <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All categories</option>
            <option value="announcement">Announcements</option>
            <option value="news">News</option>
            <option value="policy">Policies</option>
            <option value="event">Events</option>
          </select>
          {canPost && <button className="btn btn-primary text-nowrap" onClick={() => open(null)}>+ New post</button>}
        </div>
      </div>

      {show && (
        <form className="card card-body mb-3" onSubmit={save}>
          <h3 className="h5">{editId ? 'Edit post' : 'New post'}</h3>
          <Alert>{error}</Alert>
          <div className="row g-3">
            <div className="col-md-8"><label className="form-label">Title</label><input className="form-control" required maxLength="150" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="col-md-4">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="announcement">Announcement</option>
                <option value="news">News</option>
                <option value="policy">Policy</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div className="col-12"><label className="form-label">Message</label><textarea className="form-control" required rows="4" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            <div className="col-12 form-check ms-2">
              <input id="pin" className="form-check-input" type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
              <label htmlFor="pin" className="form-check-label">Pin to top</label>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary">{editId ? 'Update' : 'Publish'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(false)}>Cancel</button>
          </div>
        </form>
      )}

      {list.map((a) => (
        <div key={a._id} className={`card mb-3 ${a.pinned ? 'pinned' : ''}`}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <h3 className="h5">{a.pinned && '📌 '}{a.title}</h3>
              <span className={`badge text-bg-${catTone[a.category]} text-capitalize`}>{a.category}</span>
            </div>
            <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>{a.body}</p>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">Posted by {a.postedBy?.name || 'HR'} on {fmtDate(a.createdAt)}</small>
              {canPost && (
                <span>
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => open(a)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(a._id)}>Delete</button>
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-center text-muted py-4">Nothing here yet.</p>}
    </>
  );
}
