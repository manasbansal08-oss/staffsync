import { useState } from 'react';

import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api';
import { Alert } from '../components/ui.jsx';

const demos = [
  ['HR', 'hr@staffsync.com', 'hr1234'],
  ['Manager', 'manager@staffsync.com', 'manager123'],
  ['Employee', 'aarav@staffsync.com', 'welcome123'],
  ['Admin', 'admin@staffsync.com', 'admin123'],
];

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card shadow-sm p-4 w-100" style={{ maxWidth: 400 }} onSubmit={submit}>
        <h1 className="h2 fw-bold text-center login-brand">Staff<span>Sync</span></h1>
        <p className="text-muted text-center">Modern Human Resource Management</p>
        <Alert>{error}</Alert>
        <label className="form-label">Email</label>
        <input className="form-control mb-3" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="form-label">Password</label>
        <input className="form-control mb-3" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>

        <p className="text-center small mt-3 mb-0">New here? <Link to="/signup">Create an account</Link></p>

        <div className="bg-light rounded p-3 mt-4 small">
          <b>Demo logins</b> <span className="text-muted">(click to fill)</span>
          {demos.map(([role, email, password]) => (
            <div key={role}>
              <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setForm({ email, password })}>
                {role}: {email} / {password}
              </button>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}
