export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');
export const money = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
export const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const tones = {
  approved: 'success', active: 'success', completed: 'success',
  pending: 'warning', planned: 'info', ongoing: 'primary',
  rejected: 'danger', inactive: 'secondary', cancelled: 'secondary',
};
export const StatusBadge = ({ value }) => (
  <span className={`badge rounded-pill text-bg-${tones[value] || 'secondary'} text-capitalize`}>{value}</span>
);

export const Alert = ({ children, type = 'danger' }) =>
  children ? <div className={`alert alert-${type} py-2`}>{children}</div> : null;

export const Stat = ({ label, value, tone = 'primary' }) => (
  <div className="col-6 col-md-3">
    <div className={`card stat-card h-100 border-${tone} border-top border-3`}>
      <div className="card-body">
        <small className="text-muted">{label}</small>
        <b>{value}</b>
      </div>
    </div>
  </div>
);

export const isStaffRole = (role) => role === 'admin' || role === 'hr';
