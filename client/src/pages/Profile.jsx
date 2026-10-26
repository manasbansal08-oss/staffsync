import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Alert, toInput, fmtDate, money } from '../components/ui.jsx';

export default function Profile() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    api.get('/profile').then((r) => {
      setData(r.data);
      const e = r.data.employee;
      if (e) setForm({
        phone: e.phone || '', gender: e.gender || '', dateOfBirth: toInput(e.dateOfBirth), address: e.address || '',
        emergencyContact: { name: e.emergencyContact?.name || '', phone: e.emergencyContact?.phone || '', relation: e.emergencyContact?.relation || '' },
      });
    });
  }, []);

  if (!data) return <p className="text-center py-5">Loading...</p>;
  const emp = data.employee;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setEc = (k) => (e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, [k]: e.target.value } });

  const save = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await api.put('/profile', form);
      setMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setMsg({ type: 'danger', text: errMsg(err) });
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    try {
      await api.put('/auth/change-password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      setPwMsg({ type: 'success', text: 'Password updated.' });
    } catch (err) {
      setPwMsg({ type: 'danger', text: errMsg(err) });
    }
  };

  return (
    <>
      <h2 className="h3 mb-3">My Profile</h2>
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card h-100"><div className="card-body">
            <h3 className="h5">Job details <small className="text-muted fs-6">(managed by HR)</small></h3>
            <dl className="row mb-0">
              <dt className="col-5">Name</dt><dd className="col-7">{data.account.name}</dd>
              <dt className="col-5">Email</dt><dd className="col-7">{data.account.email}</dd>
              <dt className="col-5">Role</dt><dd className="col-7 text-capitalize">{data.account.role}</dd>
              {emp && (<>
                <dt className="col-5">Department</dt><dd className="col-7">{emp.department}</dd>
                <dt className="col-5">Designation</dt><dd className="col-7">{emp.designation}</dd>
                <dt className="col-5">Reports to</dt><dd className="col-7">{emp.manager?.name || '—'}</dd>
                <dt className="col-5">Joined</dt><dd className="col-7">{fmtDate(emp.joiningDate)}</dd>
                <dt className="col-5">Salary</dt><dd className="col-7">{money(emp.salary)}</dd>
              </>)}
            </dl>
          </div></div>
        </div>

        <div className="col-lg-6">
          <form className="card h-100" onSubmit={save}><div className="card-body">
            <h3 className="h5">Personal record</h3>
            {!emp && <p className="text-muted">No employee record is linked to this account.</p>}
            {emp && (<>
              <Alert type={msg.type}>{msg.text}</Alert>
              <div className="row g-2">
                <div className="col-6"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={set('phone')} /></div>
                <div className="col-6"><label className="form-label">Date of birth</label><input className="form-control" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></div>
                <div className="col-6">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={set('gender')}>
                    <option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
                <div className="col-12"><label className="form-label">Address</label><textarea className="form-control" rows="2" value={form.address} onChange={set('address')} /></div>
                <div className="col-12"><b className="small">Emergency contact</b></div>
                <div className="col-4"><input className="form-control" placeholder="Name" value={form.emergencyContact.name} onChange={setEc('name')} /></div>
                <div className="col-4"><input className="form-control" placeholder="Phone" value={form.emergencyContact.phone} onChange={setEc('phone')} /></div>
                <div className="col-4"><input className="form-control" placeholder="Relation" value={form.emergencyContact.relation} onChange={setEc('relation')} /></div>
              </div>
              <button className="btn btn-primary mt-3">Save changes</button>
            </>)}
          </div></form>
        </div>

        <div className="col-lg-6">
          <form className="card" onSubmit={changePw}><div className="card-body">
            <h3 className="h5">Change password</h3>
            <Alert type={pwMsg.type}>{pwMsg.text}</Alert>
            <input className="form-control mb-2" type="password" required placeholder="Current password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <input className="form-control mb-2" type="password" required minLength="6" placeholder="New password (min 6 characters)" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            <button className="btn btn-outline-primary">Update password</button>
          </div></form>
        </div>
      </div>
    </>
  );
}
