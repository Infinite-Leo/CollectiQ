import { useState, useEffect } from 'react';
import {
    IndianRupee,
    CheckCircle,
    AlertTriangle,
    ShieldCheck,
    Clock,
    Search,
    RefreshCw,
    Filter,
    FileSpreadsheet,
    DollarSign,
    Check,
    X,
    MessageSquare,
    Printer,
    Download,
    PlusCircle,
    PieChart,
    Receipt,
    Wallet,
    TrendingDown,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { formatIndianCurrency, formatIndianCompact } from '../utils/indianNumberFormat';
import ReminderTrigger from '../components/ReminderTrigger';

// Sample unpaid ledger records for WhatsApp reminder integration
const SAMPLE_UNPAID_ACCOUNTS = [
    {
        id: 'acc-1',
        donor_name: 'Dr. Subir Karmakar',
        phone: '+91 98305 67890',
        promised_amount: 7500,
        collected_amount: 0,
        pending_amount: 7500,
        zone: 'Ballygunge',
        status: 'PENDING',
        last_reminder: '2 days ago',
    },
    {
        id: 'acc-2',
        donor_name: 'Debjani Mukherjee',
        phone: '+91 98312 98765',
        promised_amount: 5000,
        collected_amount: 0,
        pending_amount: 5000,
        zone: 'Salt Lake Sector V',
        status: 'PENDING',
        last_reminder: 'Never',
    },
    {
        id: 'acc-3',
        donor_name: 'Pratik Sengupta',
        phone: '+91 91234 56789',
        promised_amount: 4000,
        collected_amount: 1000,
        pending_amount: 3000,
        zone: 'Bangur Avenue',
        status: 'PARTIAL',
        last_reminder: 'Yesterday',
    },
    {
        id: 'acc-4',
        donor_name: 'Suman Roychowdhury',
        phone: '+91 94330 11223',
        promised_amount: 2500,
        collected_amount: 0,
        pending_amount: 2500,
        zone: 'Behala',
        status: 'PENDING',
        last_reminder: '3 days ago',
    }
];

export default function FinancePortal() {
    const [handovers, setHandovers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reconcilingId, setReconcilingId] = useState(null);

    // Cashier inputs per row: { [handoverId]: { countedVal: '', logAnomaly: true, clearExpense: false, reason: '' } }
    const [cashierInputs, setCashierInputs] = useState({});
    const [activeTab, setActiveTab] = useState('handovers'); // 'handovers' | 'budgets' | 'expenses' | 'unpaid' | 'anomalies'
    const [anomalies, setAnomalies] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    // Expense entry form state
    const [expCategory, setExpCategory] = useState('Pandal Construction & Bamboo Decor');
    const [expAmount, setExpAmount] = useState('');
    const [expPaidTo, setExpPaidTo] = useState('');
    const [expMode, setExpMode] = useState('CASH');
    const [expVoucher, setExpVoucher] = useState('');
    const [expNotes, setExpNotes] = useState('');
    const [submittingExpense, setSubmittingExpense] = useState(false);

    // Fetch handovers, budgets, expenses & anomalies
    const loadData = () => {
        setLoading(true);
        Promise.all([
            apiFetch('/api/v1/finance/handovers').catch(() => ({ data: [] })),
            apiFetch('/api/v1/finance/budgets').catch(() => ({ data: [] })),
            apiFetch('/api/v1/finance/expenses').catch(() => ({ data: [] })),
            apiFetch('/api/v1/finance/anomalies').catch(() => ({ data: [] })),
        ])
            .then(([handoverRes, budgetRes, expenseRes, anomalyRes]) => {
                if (handoverRes?.data) setHandovers(handoverRes.data);
                if (budgetRes?.data) setBudgets(budgetRes.data);
                if (expenseRes?.data) setExpenses(expenseRes.data);
                if (anomalyRes?.data) setAnomalies(anomalyRes.data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCountedChange = (id, val) => {
        setCashierInputs((prev) => ({
            ...prev,
            [id]: {
                ...prev[id],
                countedVal: val,
                logAnomaly: prev[id]?.logAnomaly ?? true,
                clearExpense: prev[id]?.clearExpense ?? false,
                reason: prev[id]?.reason ?? '',
            },
        }));
    };

    const handleCheckboxToggle = (id, field) => {
        setCashierInputs((prev) => {
            const current = prev[id] || {};
            if (field === 'logAnomaly') {
                return {
                    ...prev,
                    [id]: {
                        ...current,
                        logAnomaly: true,
                        clearExpense: false,
                    },
                };
            }
            if (field === 'clearExpense') {
                return {
                    ...prev,
                    [id]: {
                        ...current,
                        clearExpense: true,
                        logAnomaly: false,
                    },
                };
            }
            return prev;
        });
    };

    const handleReconcile = async (handover, actionType = 'RECONCILE') => {
        const rowInput = cashierInputs[handover.id] || {};
        const verifiedAmount = parseFloat(rowInput.countedVal);

        if (isNaN(verifiedAmount) || verifiedAmount < 0) {
            alert('Please enter a valid numeric Counted Cash Value for this collector.');
            return;
        }

        setReconcilingId(handover.id);
        try {
            const discrepancyAction = rowInput.clearExpense ? 'CLEAR_ANOMALY_EXPENSE' : 'LOG_ANOMALY';

            await apiFetch('/api/v1/finance/reconcile-handover', {
                method: 'POST',
                body: JSON.stringify({
                    handover_id: handover.id,
                    amount_verified: verifiedAmount,
                    action: actionType,
                    discrepancy_action: discrepancyAction,
                    discrepancy_reason: rowInput.reason || (rowInput.clearExpense ? 'Out-of-pocket campaign cost verified by collector' : 'Cash discrepancy noted'),
                }),
            });

            // Update local handover list
            setHandovers((prev) =>
                prev.map((h) =>
                    h.id === handover.id
                        ? {
                              ...h,
                              amount_verified: verifiedAmount,
                              handover_status: actionType === 'DISPUTE' ? 'DISPUTED' : 'RECONCILED',
                              discrepancy_detected: verifiedAmount !== Number(h.amount_declared),
                              reconciled_at: new Date().toISOString(),
                          }
                        : h
                )
            );

            setFeedbackMessage(
                `✓ Handover for ${handover.collector_name} reconciled: Counted ${formatIndianCurrency(verifiedAmount)} against Declared ${formatIndianCurrency(handover.amount_declared)}.`
            );
            setTimeout(() => setFeedbackMessage(null), 6000);
            loadData();
        } catch (err) {
            alert('Reconciliation error: ' + err.message);
        } finally {
            setReconcilingId(null);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expAmount || Number(expAmount) <= 0 || !expPaidTo) {
            alert('Please enter valid amount and recipient.');
            return;
        }

        setSubmittingExpense(true);
        try {
            await apiFetch('/api/v1/finance/expenses', {
                method: 'POST',
                body: JSON.stringify({
                    category: expCategory,
                    amount: Number(expAmount),
                    paid_to: expPaidTo,
                    voucher_no: expVoucher || undefined,
                    payment_mode: expMode,
                    notes: expNotes,
                }),
            });

            setFeedbackMessage(`✓ Expense of ${formatIndianCurrency(expAmount)} recorded under ${expCategory}.`);
            setTimeout(() => setFeedbackMessage(null), 6000);
            setExpAmount('');
            setExpPaidTo('');
            setExpVoucher('');
            setExpNotes('');
            loadData();
        } catch (err) {
            alert('Failed to log expense: ' + err.message);
        } finally {
            setSubmittingExpense(false);
        }
    };

    // Calculate aggregate metrics
    const totalDeclaredUnreconciled = handovers
        .filter((h) => h.handover_status === 'SUBMITTED')
        .reduce((sum, h) => sum + Number(h.amount_declared || 0), 0);

    const totalReconciledCash = handovers
        .filter((h) => h.handover_status === 'RECONCILED')
        .reduce((sum, h) => sum + Number(h.amount_verified || h.amount_declared || 0), 0);

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.allocated_amount || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent_amount || 0), 0);
    const netDiscrepancy = handovers
        .filter((h) => h.handover_status === 'RECONCILED' && h.amount_verified !== null)
        .reduce((sum, h) => sum + (Number(h.amount_verified) - Number(h.amount_declared)), 0);

    return (
        <div className="finance-portal-container" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* Page Header with Cashier Persona */}
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    borderBottom: '3px solid #1B5E20',
                    padding: '18px 24px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E65100', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Treasury & Cashier Desk (ক্যাশিয়ার খাতা)
                        </span>
                        <span style={{ fontSize: '0.6875rem', backgroundColor: '#E8F5E9', color: '#1B5E20', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            Ledger Reconciliation Mode
                        </span>
                    </div>
                    <h1 style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20' }}>
                        Cashier Ledger & Fund Reconciliation
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                        href="/api/v1/export/cash-handover"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            padding: '10px 14px',
                            backgroundColor: '#F1F8E9',
                            border: '1px solid #A5D6A7',
                            color: '#1B5E20',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <Download size={14} />
                        <span>Export CSV</span>
                    </a>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        style={{
                            padding: '10px 14px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #BDBDBD',
                            color: '#424242',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <Printer size={14} />
                        <span>Print Ledger</span>
                    </button>
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        style={{
                            padding: '10px 14px',
                            backgroundColor: '#1B5E20',
                            border: 'none',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Success Feedback Alert */}
            {feedbackMessage && (
                <div
                    style={{
                        backgroundColor: '#E8F5E9',
                        color: '#1B5E20',
                        border: '1px solid #2E7D32',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <CheckCircle size={18} color="#2E7D32" />
                    <span>{feedbackMessage}</span>
                </div>
            )}

            {/* Cashier Balance Cards — Numbers First */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: '14px',
                    marginBottom: '20px',
                }}
            >
                {/* 1. Pending Count in Hand */}
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #E65100',
                        padding: '16px',
                        borderRadius: '6px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>EXPECTED CASH IN HAND</span>
                        <Wallet size={16} color="#E65100" />
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#E65100', marginTop: '6px' }}>
                        {formatIndianCurrency(totalDeclaredUnreconciled)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#B71C1C', fontWeight: 700, marginTop: '4px' }}>
                        ● {handovers.filter((h) => h.handover_status === 'SUBMITTED').length} batches awaiting physical counting
                    </div>
                </div>

                {/* 2. Reconciled & Vaulted */}
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #1B5E20',
                        padding: '16px',
                        borderRadius: '6px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>PHYSICALLY COUNTED & VAULTED</span>
                        <ShieldCheck size={16} color="#1B5E20" />
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#1B5E20', marginTop: '6px' }}>
                        {formatIndianCurrency(totalReconciledCash)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: 700, marginTop: '4px' }}>
                        ✓ Verified by Cashier desk
                    </div>
                </div>

                {/* 3. Variance / Reconciliation Status */}
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: `4px solid ${netDiscrepancy === 0 ? '#2E7D32' : netDiscrepancy > 0 ? '#1565C0' : '#C62828'}`,
                        padding: '16px',
                        borderRadius: '6px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>NET CASH VARIANCE</span>
                        <AlertTriangle size={16} color={netDiscrepancy === 0 ? '#2E7D32' : '#C62828'} />
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: netDiscrepancy === 0 ? '#2E7D32' : netDiscrepancy > 0 ? '#1565C0' : '#C62828', marginTop: '6px' }}>
                        {netDiscrepancy === 0 ? '₹0 (Balanced)' : `${netDiscrepancy > 0 ? '+' : ''}${formatIndianCurrency(netDiscrepancy)}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#616161', marginTop: '4px' }}>
                        {netDiscrepancy === 0 ? '🟢 All settled batches balance exactly' : '🟡 Review discrepancy notes'}
                    </div>
                </div>

                {/* 4. Total Budget Utilized */}
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #1565C0',
                        padding: '16px',
                        borderRadius: '6px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>BUDGET EXPENDITURE</span>
                        <TrendingDown size={16} color="#1565C0" />
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#1565C0', marginTop: '6px' }}>
                        {formatIndianCurrency(totalSpent)} <span style={{ fontSize: '0.875rem', color: '#616161', fontWeight: 600 }}>/ {formatIndianCurrency(totalBudget)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#616161', marginTop: '4px' }}>
                        {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% budget utilized` : 'Allocations active'}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs with Min 48px Touch Targets */}
            <div
                style={{
                    display: 'flex',
                    borderBottom: '2px solid #E0E0E0',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px 8px 0 0',
                    overflowX: 'auto',
                }}
            >
                <button
                    type="button"
                    onClick={() => setActiveTab('handovers')}
                    style={{
                        padding: '12px 18px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'handovers' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'handovers' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'handovers' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <FileSpreadsheet size={16} />
                    <span>Cash Handover Desk</span>
                    <span style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px' }}>
                        {handovers.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('budgets')}
                    style={{
                        padding: '12px 18px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'budgets' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'budgets' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'budgets' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <PieChart size={16} />
                    <span>Fund Allocations</span>
                    <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px' }}>
                        {budgets.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('expenses')}
                    style={{
                        padding: '12px 18px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'expenses' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'expenses' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'expenses' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Receipt size={16} />
                    <span>Expense Vouchers</span>
                    <span style={{ backgroundColor: '#FFF3E0', color: '#E65100', fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px' }}>
                        {expenses.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('unpaid')}
                    style={{
                        padding: '12px 18px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'unpaid' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'unpaid' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'unpaid' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <MessageSquare size={16} color="#E65100" />
                    <span>Unpaid Accounts & Reminders</span>
                    <span style={{ backgroundColor: '#FFE0B2', color: '#E65100', fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px' }}>
                        {SAMPLE_UNPAID_ACCOUNTS.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('anomalies')}
                    style={{
                        padding: '12px 18px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'anomalies' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'anomalies' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'anomalies' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <AlertTriangle size={16} color="#C62828" />
                    <span>Discrepancy Review Logs</span>
                </button>
            </div>

            {/* TAB 1: CASH HANDOVER DESK */}
            {activeTab === 'handovers' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <div style={{ padding: '14px 18px', backgroundColor: '#F9F9FB', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#1B5E20' }}>
                                Physical Cash Handover Register
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: '#616161' }}>
                                Compare field collector cash declarations with physical vault count
                            </span>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E0E0E0', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Collector & Batch</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Declared Cash</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', width: '220px' }}>Counted Cash Value</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Status</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'center' }}>Reconciliation Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {handovers.map((h, idx) => {
                                    const rowInput = cashierInputs[h.id] || {};
                                    const countedVal = rowInput.countedVal;
                                    const parsedCounted = parseFloat(countedVal);
                                    const hasEntered = countedVal !== undefined && countedVal !== '';
                                    const isDeviated = hasEntered && !isNaN(parsedCounted) && Math.abs(parsedCounted - Number(h.amount_declared)) > 0.001;
                                    const isReconciled = h.handover_status === 'RECONCILED';

                                    return (
                                        <tr
                                            key={h.id}
                                            style={{
                                                borderBottom: '1px solid #E0E0E0',
                                                backgroundColor: isDeviated ? '#FFFDE7' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                                                verticalAlign: 'top',
                                            }}
                                        >
                                            {/* Collector & Batch Info */}
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ fontWeight: 800, color: '#1B5E20', fontSize: '0.875rem' }}>
                                                    {h.collector_name}
                                                </div>
                                                <div style={{ fontSize: '0.6875rem', color: '#616161', marginTop: '2px' }}>
                                                    Zone: {h.zone || 'Kolkata Field Batch'} • {new Date(h.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {h.notes && (
                                                    <div style={{ fontSize: '0.6875rem', color: '#757575', fontStyle: 'italic', marginTop: '2px' }}>
                                                        "{h.notes}"
                                                    </div>
                                                )}
                                            </td>

                                            {/* Declared Cash Total */}
                                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#212121' }}>
                                                    {formatIndianCurrency(h.amount_declared)}
                                                </span>
                                            </td>

                                            {/* Counted Cash Value input cell */}
                                            <td style={{ padding: '12px 14px' }}>
                                                {isReconciled ? (
                                                    <div style={{ fontWeight: 800, color: '#2E7D32', fontSize: '0.9375rem' }}>
                                                        {formatIndianCurrency(h.amount_verified)} (Counted)
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div style={{ position: 'relative' }}>
                                                            <span style={{ position: 'absolute', left: '10px', top: '9px', fontWeight: 700, color: '#757575' }}>₹</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                placeholder="Counted Cash Value"
                                                                value={countedVal ?? ''}
                                                                onChange={(e) => handleCountedChange(h.id, e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    minHeight: '44px',
                                                                    padding: '8px 10px 8px 24px',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 700,
                                                                    border: isDeviated ? '2px solid #E65100' : '1px solid #BDBDBD',
                                                                    borderRadius: '4px',
                                                                    backgroundColor: '#FFFFFF',
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Deviation Warning Checklist */}
                                                        {isDeviated && (
                                                            <div
                                                                style={{
                                                                    marginTop: '8px',
                                                                    padding: '8px',
                                                                    backgroundColor: '#FFF3E0',
                                                                    border: '1px solid #FFE0B2',
                                                                    borderRadius: '4px',
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#E65100', fontWeight: 800, fontSize: '0.6875rem', marginBottom: '6px' }}>
                                                                    <AlertTriangle size={13} />
                                                                    <span>
                                                                        Discrepancy: {formatIndianCurrency(Math.abs(parsedCounted - Number(h.amount_declared)))} {parsedCounted > Number(h.amount_declared) ? 'Excess' : 'Shortage'}
                                                                    </span>
                                                                </div>

                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.6875rem' }}>
                                                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`action-${h.id}`}
                                                                            checked={rowInput.logAnomaly}
                                                                            onChange={() => handleCheckboxToggle(h.id, 'logAnomaly')}
                                                                        />
                                                                        <span>Log to Discrepancy Review Queue</span>
                                                                    </label>

                                                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`action-${h.id}`}
                                                                            checked={rowInput.clearExpense}
                                                                            onChange={() => handleCheckboxToggle(h.id, 'clearExpense')}
                                                                        />
                                                                        <span>Clear: Authorized out-of-pocket field cost</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td style={{ padding: '12px 14px' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 800,
                                                        backgroundColor:
                                                            h.handover_status === 'RECONCILED'
                                                                ? '#E8F5E9'
                                                                : h.handover_status === 'DISPUTED'
                                                                ? '#FFEBEE'
                                                                : '#FFF9C4',
                                                        color:
                                                            h.handover_status === 'RECONCILED'
                                                                ? '#2E7D32'
                                                                : h.handover_status === 'DISPUTED'
                                                                ? '#C62828'
                                                                : '#E65100',
                                                        border: `1px solid ${
                                                            h.handover_status === 'RECONCILED'
                                                                ? '#2E7D32'
                                                                : h.handover_status === 'DISPUTED'
                                                                ? '#C62828'
                                                                : '#F9A825'
                                                        }`,
                                                    }}
                                                >
                                                    {h.handover_status}
                                                </span>
                                            </td>

                                            {/* Action Buttons */}
                                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                {isReconciled ? (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2E7D32', fontWeight: 700, fontSize: '0.75rem' }}>
                                                        <Check size={14} /> Reconciled
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                        <button
                                                            type="button"
                                                            disabled={reconcilingId === h.id || !hasEntered}
                                                            onClick={() => handleReconcile(h, 'RECONCILE')}
                                                            style={{
                                                                minHeight: '44px',
                                                                padding: '6px 14px',
                                                                backgroundColor: '#1B5E20',
                                                                color: '#FFFFFF',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                fontWeight: 700,
                                                                fontSize: '0.75rem',
                                                                cursor: hasEntered ? 'pointer' : 'not-allowed',
                                                                opacity: hasEntered ? 1 : 0.6,
                                                            }}
                                                        >
                                                            {reconcilingId === h.id ? 'Saving...' : 'Reconcile'}
                                                        </button>

                                                        {isDeviated && (
                                                            <button
                                                                type="button"
                                                                disabled={reconcilingId === h.id}
                                                                onClick={() => handleReconcile(h, 'DISPUTE')}
                                                                style={{
                                                                    minHeight: '44px',
                                                                    padding: '6px 12px',
                                                                    backgroundColor: '#FFEBEE',
                                                                    color: '#C62828',
                                                                    border: '1px solid #C62828',
                                                                    borderRadius: '4px',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.75rem',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                Dispute
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: FUND ALLOCATION & BUDGET STATUS */}
            {activeTab === 'budgets' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <div style={{ padding: '14px 18px', backgroundColor: '#F9F9FB', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#1B5E20' }}>
                                Campaign Budget Allocations (বাজেট বরাদ্দ)
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: '#616161' }}>
                                Category-wise budget limits vs actual money spent
                            </span>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E0E0E0', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Category</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Allocated Budget</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Total Spent</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Remaining Balance</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', width: '180px' }}>Utilization</th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgets.map((b, idx) => {
                                    const rem = Number(b.allocated_amount) - Number(b.spent_amount);
                                    const pct = Math.min(100, Math.round((Number(b.spent_amount) / (Number(b.allocated_amount) || 1)) * 100));
                                    return (
                                        <tr key={b.id || idx} style={{ borderBottom: '1px solid #E0E0E0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ fontWeight: 800, color: '#212121' }}>{b.category_name}</div>
                                                {b.notes && <div style={{ fontSize: '0.6875rem', color: '#616161' }}>{b.notes}</div>}
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>
                                                {formatIndianCurrency(b.allocated_amount)}
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#C62828' }}>
                                                {formatIndianCurrency(b.spent_amount)}
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: rem >= 0 ? '#2E7D32' : '#C62828' }}>
                                                {formatIndianCurrency(rem)}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ flex: 1, backgroundColor: '#E0E0E0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                                        <div
                                                            style={{
                                                                width: `${pct}%`,
                                                                backgroundColor: pct > 90 ? '#C62828' : pct > 75 ? '#F9A825' : '#2E7D32',
                                                                height: '100%',
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#424242', width: '36px', textAlign: 'right' }}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: EXPENSE VOUCHER TRACKER */}
            {activeTab === 'expenses' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    {/* Log New Expense Voucher Form */}
                    <div style={{ padding: '18px', backgroundColor: '#F9F9FB', borderBottom: '2px solid #E0E0E0' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 800, color: '#1B5E20' }}>
                            + Log New Cash / Bank Expense Voucher
                        </h3>
                        <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#424242', marginBottom: '4px' }}>Category *</label>
                                <select
                                    value={expCategory}
                                    onChange={(e) => setExpCategory(e.target.value)}
                                    style={{ width: '100%', minHeight: '44px', padding: '8px', borderRadius: '4px', border: '1px solid #BDBDBD', fontWeight: 600 }}
                                >
                                    {budgets.map((b) => (
                                        <option key={b.id} value={b.category_name}>{b.category_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#424242', marginBottom: '4px' }}>Amount (₹) *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="e.g. 5000"
                                    value={expAmount}
                                    onChange={(e) => setExpAmount(e.target.value)}
                                    style={{ width: '100%', minHeight: '44px', padding: '8px', borderRadius: '4px', border: '1px solid #BDBDBD', fontWeight: 700 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#424242', marginBottom: '4px' }}>Paid To (Vendor / Person) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Maa Tara Sound"
                                    value={expPaidTo}
                                    onChange={(e) => setExpPaidTo(e.target.value)}
                                    style={{ width: '100%', minHeight: '44px', padding: '8px', borderRadius: '4px', border: '1px solid #BDBDBD' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#424242', marginBottom: '4px' }}>Payment Mode</label>
                                <select
                                    value={expMode}
                                    onChange={(e) => setExpMode(e.target.value)}
                                    style={{ width: '100%', minHeight: '44px', padding: '8px', borderRadius: '4px', border: '1px solid #BDBDBD' }}
                                >
                                    <option value="CASH">CASH</option>
                                    <option value="UPI">UPI</option>
                                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                                    <option value="CHEQUE">CHEQUE</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#424242', marginBottom: '4px' }}>Voucher No / Notes</label>
                                <input
                                    type="text"
                                    placeholder="e.g. VCH-044, Advance"
                                    value={expNotes}
                                    onChange={(e) => setExpNotes(e.target.value)}
                                    style={{ width: '100%', minHeight: '44px', padding: '8px', borderRadius: '4px', border: '1px solid #BDBDBD' }}
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={submittingExpense}
                                    style={{
                                        width: '100%',
                                        minHeight: '44px',
                                        backgroundColor: '#1B5E20',
                                        color: '#FFFFFF',
                                        fontWeight: 800,
                                        fontSize: '0.8125rem',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {submittingExpense ? 'Saving...' : 'Record Voucher'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E0E0E0', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Date & Voucher</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Paid To</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Category</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Mode</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((exp, idx) => (
                                    <tr key={exp.id || idx} style={{ borderBottom: '1px solid #E0E0E0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ fontWeight: 800, color: '#1B5E20' }}>{exp.voucher_no}</div>
                                            <div style={{ fontSize: '0.6875rem', color: '#616161' }}>{exp.date}</div>
                                        </td>
                                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#212121' }}>
                                            {exp.paid_to}
                                            {exp.notes && <div style={{ fontSize: '0.6875rem', color: '#616161', fontWeight: 400 }}>{exp.notes}</div>}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#424242' }}>{exp.category}</td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', backgroundColor: '#EDE7F6', color: '#512DA8', borderRadius: '4px' }}>
                                                {exp.payment_mode}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#C62828', fontSize: '0.9375rem' }}>
                                            {formatIndianCurrency(exp.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: UNPAID ACCOUNTS & WHATSAPP REMINDERS */}
            {activeTab === 'unpaid' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <div style={{ padding: '14px 18px', backgroundColor: '#F9F9FB', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#1B5E20' }}>
                                Outstanding Pledge Recovery Ledger
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: '#616161' }}>
                                Trigger official WhatsApp notifications to donors with neighborhood collector visit schedules
                            </span>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E0E0E0', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Donor Name</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Locality / Zone</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Promised</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Outstanding</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Status</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'center' }}>WhatsApp Engine</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SAMPLE_UNPAID_ACCOUNTS.map((acc, idx) => (
                                    <tr key={acc.id} style={{ borderBottom: '1px solid #E0E0E0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ fontWeight: 800, color: '#212121' }}>{acc.donor_name}</div>
                                            <div style={{ fontSize: '0.6875rem', color: '#616161' }}>{acc.phone}</div>
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#424242' }}>
                                            {acc.zone}
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>
                                            {formatIndianCurrency(acc.promised_amount)}
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#C62828' }}>
                                            {formatIndianCurrency(acc.pending_amount)}
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 800,
                                                    backgroundColor: acc.status === 'PARTIAL' ? '#FFF9C4' : '#FFEBEE',
                                                    color: acc.status === 'PARTIAL' ? '#F9A825' : '#C62828',
                                                    border: `1px solid ${acc.status === 'PARTIAL' ? '#F9A825' : '#C62828'}`,
                                                }}
                                            >
                                                {acc.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <ReminderTrigger
                                                donorName={acc.donor_name}
                                                balanceAmount={acc.pending_amount}
                                                mobile={acc.phone}
                                                compact={false}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 5: DISCREPANCY & REVIEW LOGS */}
            {activeTab === 'anomalies' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <div style={{ padding: '14px 18px', backgroundColor: '#F9F9FB', borderBottom: '1px solid #E0E0E0' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#1B5E20' }}>
                            Discrepancy Review Queue
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#616161' }}>
                            Items flagged for secretary/cashier review due to cash count variance
                        </span>
                    </div>

                    <div style={{ padding: '16px' }}>
                        {anomalies.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#2E7D32', fontSize: '0.875rem', fontWeight: 700 }}>
                                ✓ No open cash discrepancies detected. All current handover balances match verified totals.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {anomalies.map((a, i) => (
                                    <div
                                        key={a.id || i}
                                        style={{
                                            border: '1px solid #E0E0E0',
                                            borderLeft: `5px solid ${a.severity_level === 'CRITICAL' ? '#C62828' : '#F9A825'}`,
                                            padding: '12px 16px',
                                            borderRadius: '4px',
                                            backgroundColor: '#FAFAFA',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#212121' }}>
                                                {a.reason_code?.replace(/_/g, ' ')}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#616161' }}>
                                                Record: {a.target_record_id} • {new Date(a.created_at || Date.now()).toLocaleString()}
                                            </div>
                                            {a.notes && <div style={{ fontSize: '0.75rem', color: '#424242', marginTop: '2px' }}>{a.notes}</div>}
                                        </div>
                                        <span
                                            style={{
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.6875rem',
                                                fontWeight: 800,
                                                backgroundColor: a.review_status === 'RESOLVED_VALID' ? '#E8F5E9' : '#FFF9C4',
                                                color: a.review_status === 'RESOLVED_VALID' ? '#2E7D32' : '#E65100',
                                            }}
                                        >
                                            {a.review_status === 'RESOLVED_VALID' ? 'RESOLVED' : 'REQUIRES REVIEW'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
