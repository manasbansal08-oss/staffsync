import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api';
import { Alert } from '../components/ui.jsx';

const empty = { name: '', email: '', phone: '', department: '', designation: '', password: '', confirm: '' };

export default function Signup() {
  const { register } = useAuth();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      await register(payload);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card shadow-sm p-4 w-100" style={{ maxWidth: 480 }} onSubmit={submit}>
        <h1 className="h2 fw-bold text-center login-brand">Staff<span>Sync</span></h1>
        <p className="text-muted text-center">Create your employee account</p>
        <Alert>{error}</Alert>

        <label className="form-label">Full name</label>
        <input className="form-control mb-3" required value={form.name} onChange={set('name')} />

        <div className="row">
          <div className="col-md-7">
            <label className="form-label">Email</label>
            <input className="form-control mb-3" type="email" required value={form.email} onChange={set('email')} />
          </div>
          <div className="col-md-5">
            <label className="form-label">Phone <span className="text-muted">(optional)</span></label>
            <input className="form-control mb-3" type="tel" value={form.phone} onChange={set('phone')} />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Department</label>
            <input className="form-control mb-3" required placeholder="e.g. Engineering" value={form.department} onChange={set('department')} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Designation</label>
            <input className="form-control mb-3" required placeholder="e.g. Developer" value={form.designation} onChange={set('designation')} />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Password</label>
            <input className="form-control mb-3" type="password" required minLength={6} value={form.password} onChange={set('password')} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Confirm password</label>
            <input className="form-control mb-3" type="password" required value={form.confirm} onChange={set('confirm')} />
          </div>
        </div>

        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Creating account...' : 'Sign up'}</button>
        <p className="text-center small mt-3 mb-0">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
