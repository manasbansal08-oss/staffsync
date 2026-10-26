import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Alert, StatusBadge } from '../components/ui.jsx';

const empty = { name: '', email: '', phone: '', department: '', designation: '', salary: '', role: 'employee', manager: '' };

export default function Employees() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [managers, setManagers] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/employees', { params: { search } }).then((r) => setList(r.data));
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);
  // list of people who can be chosen as 'reports to'
  useEffect(() => { api.get('/employees').then((r) => setManagers(r.data)); }, [list.length]);

  const open = (emp) => {
    setError('');
    setEditId(emp ? emp._id : null);
    setForm(emp ? { ...emp, manager: emp.manager?._id || '', role: emp.user?.role || 'employee' } : empty);
    setShow(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { user: _u, ...rest } = form; // 'user' is a populated object, not an editable field
      const payload = { ...rest, manager: form.manager || null };
      if (editId) await api.put(`/employees/${editId}`, payload);
      else await api.post('/employees', payload);
      setShow(false);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this employee and their login?')) return;
    try { await api.delete(`/employees/${id}`); load(); } catch (err) { alert(errMsg(err)); }
  };

  const toggle = async (emp) => {
    await api.put(`/employees/${emp._id}`, { status: emp.status === 'active' ? 'inactive' : 'active' });
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="h3 m-0">Employees</h2>
        <div className="d-flex gap-2">
          <input className="form-control" placeholder="Search name, email, role..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-primary text-nowrap" onClick={() => open(null)}>+ Add Employee</button>
        </div>
      </div>

      {show && (
        <form className="card card-body mb-3" onSubmit={save}>
          <h3 className="h5">{editId ? 'Edit Employee' : 'New Employee'}</h3>
          <Alert>{error}</Alert>
          <div className="row g-3">
            <div className="col-md-4"><label className="form-label">Name</label><input className="form-control" required value={form.name} onChange={set('name')} /></div>
            <div className="col-md-4"><label className="form-label">Email</label><input className="form-control" type="email" required disabled={!!editId} value={form.email} onChange={set('email')} /></div>
            <div className="col-md-4"><label className="form-label">Phone</label><input className="form-control" value={form.phone || ''} onChange={set('phone')} /></div>
            <div className="col-md-4"><label className="form-label">Department</label><input className="form-control" required value={form.department} onChange={set('department')} /></div>
            <div className="col-md-4"><label className="form-label">Designation</label><input className="form-control" required value={form.designation} onChange={set('designation')} /></div>
            <div className="col-md-4"><label className="form-label">Salary (₹)</label><input className="form-control" type="number" min="0" required value={form.salary} onChange={set('salary')} /></div>
            <div className="col-md-4">
              <label className="form-label">Login role</label>
              <select className="form-select" value={form.role} onChange={set('role')}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Reports to (manager)</label>
              <select className="form-select" value={form.manager} onChange={set('manager')}>
                <option value="">— None —</option>
                {managers.filter((m) => m._id !== editId).map((m) => <option key={m._id} value={m._id}>{m.name} ({m.designation})</option>)}
              </select>
            </div>
          </div>
          {!editId && <p className="text-muted small mt-3 mb-0">A login is created automatically. Default password: <b>welcome123</b></p>}
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card table-responsive">
        <table className="table table-hover mb-0">
          <thead><tr><th>Name</th><th>Department</th><th>Designation</th><th>Reports to</th><th>Salary</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((e) => (
              <tr key={e._id}>
                <td><b>{e.name}</b> {e.user?.role === 'manager' && <span className="badge text-bg-primary">Manager</span>}<br /><small className="text-muted">{e.email}</small></td>
                <td>{e.department}</td>
                <td>{e.designation}</td>
                <td>{e.manager?.name || '—'}</td>
                <td>₹{e.salary.toLocaleString('en-IN')}</td>
                <td role="button" onClick={() => toggle(e)} title="Click to toggle"><StatusBadge value={e.status} /></td>
                <td className="text-nowrap">
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => open(e)}>Edit</button>
                  {user.role === 'admin' && <button className="btn btn-sm btn-danger" onClick={() => remove(e._id)}>Delete</button>}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="7" className="text-center text-muted">No employees found</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
