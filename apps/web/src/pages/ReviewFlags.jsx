import { useState } from 'react';
import { ShieldCheck, AlertTriangle, Eye, CheckCircle, XCircle, Search, HelpCircle, Check } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';
import { formatIndianCurrency } from '../utils/indianNumberFormat';

const initialReviewFlags = [
    {
        id: 1,
        type: 'Location Distance Notice',
        description: 'Collection recorded 2.4km from mapped house address (Collector likely logged entry while traveling)',
        severity: 'medium',
        collector: 'Souvik Mukherjee',
        receipt: 'CQ-DP26-000238',
        amount: 5000,
        status: 'open',
        time: '1 hr ago',
    },
    {
        id: 2,
        type: 'Batch Quick Entry',
        description: '4 donations entered within 2 minutes (Collector recorded multiple offline register chits at once)',
        severity: 'low',
        collector: 'Debabrata Das',
        receipt: 'CQ-DP26-000230',
        amount: 2000,
        status: 'open',
        time: '3 hrs ago',
    },
    {
        id: 3,
        type: 'Generous Contribution',
        description: 'Donation of ₹25,000 exceeds standard range — recommended to send official secretary acknowledgement',
        severity: 'low',
        collector: 'Pritam Mondal',
        receipt: 'CQ-DP26-000225',
        amount: 25000,
        status: 'open',
        time: '5 hrs ago',
    },
    {
        id: 4,
        type: 'High Pending Ratio',
        description: '70% of collections in this batch marked as "Pending Follow-up" — schedule second visit',
        severity: 'medium',
        collector: 'Suman Roy',
        receipt: '—',
        amount: 0,
        status: 'investigating',
        time: '8 hrs ago',
    },
    {
        id: 5,
        type: 'Potential Duplicate Entry',
        description: 'Same donor & amount entered twice today (Rajesh Banerjee ₹5,000) — verify if 2nd installment or duplicate',
        severity: 'medium',
        collector: 'Souvik Mukherjee',
        receipt: 'CQ-DP26-000248',
        amount: 5000,
        status: 'resolved',
        time: '1 day ago',
    },
];

export default function ReviewFlags() {
    const [flags, setFlags] = useState(initialReviewFlags);
    const [confirmAction, setConfirmAction] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const { isLoadingAppData } = useAppData();
    const toast = useToast();

    const updateStatus = (id, newStatus) => {
        setFlags(flags.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
        setConfirmAction(null);
        toast.success(`Record marked as ${newStatus === 'resolved' ? 'Verified' : 'Acknowledged'}`);
    };

    const openCount = flags.filter((f) => f.status === 'open').length;

    const filtered = flags.filter((f) => {
        if (filterStatus === 'ALL') return true;
        return f.status === filterStatus;
    });

    return (
        <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* Confirmation Modal */}
            <Modal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                title={confirmAction?.action === 'resolve' ? 'Verify and Approve Record' : 'Acknowledge Notice'}
                maxWidth="440px"
            >
                {confirmAction && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center', padding: '10px 0' }}>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: '#E8F5E9',
                                color: '#1B5E20',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                            }}
                        >
                            <CheckCircle size={28} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#212121' }}>
                            {confirmAction.action === 'resolve' ? 'Confirm and Approve Record?' : 'Acknowledge Record?'}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#616161', margin: 0 }}>
                            {confirmAction.action === 'resolve'
                                ? 'This will mark the entry as checked and fully verified by committee. The donation remains in the ledger.'
                                : 'This marks the notice as reviewed by administrator.'}
                        </p>
                        <div style={{ fontSize: '0.8125rem', color: '#757575', backgroundColor: '#F9F9FB', padding: '8px', borderRadius: '6px' }}>
                            <strong>{confirmAction.flag.type}</strong> — {confirmAction.flag.collector}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setConfirmAction(null)}
                                style={{ flex: 1, minHeight: '44px' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => updateStatus(confirmAction.flag.id, 'resolved')}
                                style={{ flex: 1, minHeight: '44px', fontWeight: 800 }}
                            >
                                Approve & Verify
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={26} color="#1B5E20" />
                        Verification & Review Flags
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#616161', marginTop: '4px' }}>
                        {openCount} entry notices suggested by CollectiQ for secretary check
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {['ALL', 'open', 'investigating', 'resolved'].map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setFilterStatus(st)}
                            style={{
                                padding: '8px 14px',
                                minHeight: '40px',
                                border: filterStatus === st ? '2px solid #1B5E20' : '1px solid #E0E0E0',
                                backgroundColor: filterStatus === st ? '#E8F5E9' : '#FFFFFF',
                                color: filterStatus === st ? '#1B5E20' : '#424242',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                            }}
                        >
                            {st === 'open' ? 'Needs Review' : st === 'investigating' ? 'In Progress' : st}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderTop: '4px solid #E65100', padding: '16px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>NEEDS COMMITTEE REVIEW</span>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#E65100', marginTop: '4px' }}>
                        {flags.filter((f) => f.status === 'open').length}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#616161' }}>Review suggested by CollectiQ</span>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderTop: '4px solid #1565C0', padding: '16px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>IN PROGRESS</span>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#1565C0', marginTop: '4px' }}>
                        {flags.filter((f) => f.status === 'investigating').length}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#616161' }}>Collector follow-up requested</span>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderTop: '4px solid #1B5E20', padding: '16px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>VERIFIED & APPROVED</span>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#1B5E20', marginTop: '4px' }}>
                        {flags.filter((f) => f.status === 'resolved').length}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: 700 }}>✓ Verified accurately</span>
                </div>
            </div>

            {/* Flags Table */}
            <div className="card" style={{ border: '1px solid #E0E0E0', borderRadius: '8px', overflow: 'hidden' }}>
                <div className="table-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E0E0E0', textAlign: 'left' }}>
                                <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Review Category</th>
                                <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>CollectiQ Notice</th>
                                <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Collector</th>
                                <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Receipt</th>
                                <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Amount</th>
                                <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Status</th>
                                <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '28px', textAlign: 'center', color: '#2E7D32', fontWeight: 700 }}>
                                        ✓ No items requiring review in this category.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((f) => (
                                    <tr key={f.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                        <td style={{ padding: '12px 14px' }}>
                                            <strong style={{ color: '#1B5E20' }}>{f.type}</strong>
                                            <div style={{ fontSize: '0.6875rem', color: '#757575' }}>{f.time}</div>
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#424242', maxWidth: '340px' }}>
                                            {f.description}
                                        </td>
                                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#212121' }}>
                                            {f.collector}
                                        </td>
                                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#616161' }}>
                                            {f.receipt}
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#212121' }}>
                                            {f.amount > 0 ? formatIndianCurrency(f.amount) : '—'}
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 800,
                                                    backgroundColor:
                                                        f.status === 'resolved'
                                                            ? '#E8F5E9'
                                                            : f.status === 'investigating'
                                                            ? '#E3F2FD'
                                                            : '#FFF9C4',
                                                    color:
                                                        f.status === 'resolved'
                                                            ? '#2E7D32'
                                                            : f.status === 'investigating'
                                                            ? '#1565C0'
                                                            : '#E65100',
                                                    border: `1px solid ${
                                                        f.status === 'resolved'
                                                            ? '#2E7D32'
                                                            : f.status === 'investigating'
                                                            ? '#1565C0'
                                                            : '#F9A825'
                                                    }`,
                                                }}
                                            >
                                                {f.status === 'resolved'
                                                    ? 'Verified'
                                                    : f.status === 'investigating'
                                                    ? 'In Progress'
                                                    : 'Needs Review'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            {f.status !== 'resolved' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmAction({ flag: f, action: 'resolve' })}
                                                    style={{
                                                        minHeight: '36px',
                                                        padding: '4px 12px',
                                                        backgroundColor: '#1B5E20',
                                                        color: '#FFFFFF',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                    }}
                                                >
                                                    <Check size={13} />
                                                    <span>Mark Verified</span>
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: 700 }}>
                                                    ✓ Verified
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
