import { useState } from 'react';
import { ShieldAlert, AlertTriangle, Eye, CheckCircle, XCircle, Search } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/Modal';

const initialFraudFlags = [
    { id: 1, type: 'GPS Anomaly', description: 'Collection location 2.4km from house address', severity: 'high', collector: 'Ravi Kumar', receipt: 'DNC-DP26-000238', amount: 5000, status: 'open', time: '1 hr ago' },
    { id: 2, type: 'Rapid Entry', description: '4 donations in 90 seconds by same collector', severity: 'high', collector: 'Manoj Ghosh', receipt: 'DNC-DP26-000230', amount: 2000, status: 'open', time: '3 hrs ago' },
    { id: 3, type: 'Amount Outlier', description: 'Donation ₹25,000 exceeds 3σ threshold (avg ₹3,200)', severity: 'medium', collector: 'Priya Sen', receipt: 'DNC-DP26-000225', amount: 25000, status: 'open', time: '5 hrs ago' },
    { id: 4, type: 'Excessive Dues', description: '72% of today\'s entries marked as "Due"', severity: 'medium', collector: 'Suman Roy', receipt: '-', amount: 0, status: 'investigating', time: '8 hrs ago' },
    { id: 5, type: 'Duplicate', description: 'Same donor + amount + day (Rajesh Banerjee ₹5,000)', severity: 'low', collector: 'Ravi Kumar', receipt: 'DNC-DP26-000248', amount: 5000, status: 'dismissed', time: '1 day ago' },
    { id: 6, type: 'GPS Anomaly', description: 'Collection location 1.1km from house', severity: 'medium', collector: 'Ankit Sharma', receipt: 'DNC-DP26-000210', amount: 3000, status: 'resolved', time: '2 days ago' },
];

function severityIcon(severity) {
    switch (severity) {
        case 'critical': return <ShieldAlert size={16} />;
        case 'high': return <AlertTriangle size={16} />;
        default: return <Eye size={16} />;
    }
}

function statusBadge(status) {
    const map = { open: 'badge-due', investigating: 'badge-cash', resolved: 'badge-paid', dismissed: 'badge-draft' };
    return `badge ${map[status] || 'badge-draft'}`;
}

export default function FraudFlags() {
    const [flags, setFlags] = useState(initialFraudFlags);
    const [confirmAction, setConfirmAction] = useState(null);
    const toast = useToast();

    const updateStatus = (id, newStatus) => {
        setFlags(flags.map(f => f.id === id ? { ...f, status: newStatus } : f));
        setConfirmAction(null);
        toast.success(`Flag ${newStatus === 'resolved' ? 'resolved' : newStatus === 'dismissed' ? 'dismissed' : 'updated'} successfully`);
    };

    const openCount = flags.filter(f => f.status === 'open').length;

    return (
        <>
            {/* Confirmation Modal */}
            <Modal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                title={confirmAction?.action === 'resolve' ? 'Resolve Flag' : 'Dismiss Flag'}
                maxWidth="420px"
            >
                {confirmAction && (
                    <div className="confirm-dialog">
                        <div className={`icon ${confirmAction.action === 'resolve' ? 'warning' : 'danger'}`}>
                            {confirmAction.action === 'resolve' ? <CheckCircle size={28} /> : <XCircle size={28} />}
                        </div>
                        <h3>{confirmAction.action === 'resolve' ? 'Resolve this flag?' : 'Dismiss this flag?'}</h3>
                        <p>
                            {confirmAction.action === 'resolve'
                                ? 'This will mark the flag as resolved. The associated donation will remain valid.'
                                : 'This will dismiss the flag as a false positive. Are you sure?'
                            }
                        </p>
                        <p style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '-12px' }}>
                            {confirmAction.flag.type} — {confirmAction.flag.collector}
                        </p>
                        <div className="actions">
                            <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                            <button
                                className={`btn ${confirmAction.action === 'resolve' ? 'btn-primary' : 'btn-danger'}`}
                                onClick={() => updateStatus(confirmAction.flag.id, confirmAction.action === 'resolve' ? 'resolved' : 'dismissed')}
                            >
                                {confirmAction.action === 'resolve' ? 'Resolve' : 'Dismiss'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={24} color="var(--color-error)" />
                        Fraud Flags
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {openCount} open flag{openCount !== 1 ? 's' : ''} requiring review
                    </p>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                {[
                    { label: 'Open', value: flags.filter(f => f.status === 'open').length, accent: 'error' },
                    { label: 'Investigating', value: flags.filter(f => f.status === 'investigating').length, accent: 'gold' },
                    { label: 'Resolved', value: flags.filter(f => f.status === 'resolved').length, accent: 'green' },
                    { label: 'Dismissed', value: flags.filter(f => f.status === 'dismissed').length, accent: 'saffron' },
                ].map((s) => (
                    <div key={s.label} className={`kpi-card ${s.accent}`}>
                        <div className="kpi-content">
                            <div className="kpi-label">{s.label}</div>
                            <div className="kpi-value">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Flags Table */}
            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Severity</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Collector</th>
                                <th>Receipt</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Status</th>
                                <th>Time</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {flags.map((f) => (
                                <tr key={f.id} style={{ background: f.status === 'open' && f.severity === 'high' ? 'var(--color-error-light)' : undefined }}>
                                    <td>
                                        <span className={`badge badge-${f.severity}`}>
                                            {severityIcon(f.severity)}
                                            {f.severity.charAt(0).toUpperCase() + f.severity.slice(1)}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{f.type}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', maxWidth: '280px' }}>{f.description}</td>
                                    <td>{f.collector}</td>
                                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{f.receipt}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        {f.amount > 0 ? <span className="amount">₹{f.amount.toLocaleString('en-IN')}</span> : '-'}
                                    </td>
                                    <td><span className={statusBadge(f.status)}>{f.status.charAt(0).toUpperCase() + f.status.slice(1)}</span></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{f.time}</td>
                                    <td>
                                        {f.status === 'open' && (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ height: '28px', padding: '0 6px' }}
                                                    title="Investigate"
                                                    onClick={() => updateStatus(f.id, 'investigating')}
                                                >
                                                    <Search size={14} color="var(--color-info)" />
                                                </button>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ height: '28px', padding: '0 6px' }}
                                                    title="Resolve"
                                                    onClick={() => setConfirmAction({ flag: f, action: 'resolve' })}
                                                >
                                                    <CheckCircle size={14} color="var(--brand-green)" />
                                                </button>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ height: '28px', padding: '0 6px' }}
                                                    title="Dismiss"
                                                    onClick={() => setConfirmAction({ flag: f, action: 'dismiss' })}
                                                >
                                                    <XCircle size={14} color="var(--text-muted)" />
                                                </button>
                                            </div>
                                        )}
                                        {f.status === 'investigating' && (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ height: '28px', padding: '0 6px' }}
                                                    title="Resolve"
                                                    onClick={() => setConfirmAction({ flag: f, action: 'resolve' })}
                                                >
                                                    <CheckCircle size={14} color="var(--brand-green)" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
