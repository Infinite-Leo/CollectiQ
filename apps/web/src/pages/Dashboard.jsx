import React, { useState, useMemo, useEffect } from 'react';
import {
    IndianRupee,
    Clock,
    CheckCircle2,
    Plus,
    Users,
    Landmark,
    Printer,
    ArrowUpRight,
    Package2,
    SlidersHorizontal,
    Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import Modal from '../components/Modal';
import DonationForm from '../components/DonationForm';
import AttentionList from '../components/AttentionList';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

const C = {
    gold: '#D4AF37',
    goldDark: '#AA8822',
    saffron: '#C97B2A',
    emerald: '#10B981',
    crimson: '#EF4444',
    cardBg: 'var(--bg-surface, #1E1B18)',
    border: 'var(--border-default, rgba(255,255,255,0.08))',
    warmText: 'var(--text-primary, #FDFBF7)',
    mutedText: 'var(--text-muted, #9CA3AF)',
};

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: C.cardBg,
            border: `1px solid ${C.border}`,
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontFamily: 'Sora, sans-serif',
        }}>
            <div style={{ color: C.mutedText, fontSize: '0.75rem', marginBottom: '4px' }}>{label}</div>
            <div style={{ color: C.warmText, fontSize: '0.95rem', fontWeight: 700 }}>
                {fmt(payload[0].value)}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const { stats, trendData, collectorRanking, recentDonations, isLoadingAppData } = useAppData();

    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [chartRange, setChartRange] = useState('7D');
    const [uiMode, setUiMode] = useState(() => localStorage.getItem('collectiq_ui_mode') || 'standard');

    useEffect(() => {
        const handleModeChange = () => {
            setUiMode(localStorage.getItem('collectiq_ui_mode') || 'standard');
        };
        window.addEventListener('collectiq_mode_changed', handleModeChange);
        return () => window.removeEventListener('collectiq_mode_changed', handleModeChange);
    }, []);

    const toggleUiMode = () => {
        const nextMode = uiMode === 'simple' ? 'standard' : 'simple';
        localStorage.setItem('collectiq_ui_mode', nextMode);
        setUiMode(nextMode);
        window.dispatchEvent(new Event('collectiq_mode_changed'));
    };

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Committee Member';
    const displayRole = user?.app_metadata?.role || 'Admin';

    // Greeting according to time of day
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    const filteredTrend = useMemo(() => {
        if (!trendData || trendData.length === 0) return [];
        if (chartRange === 'All') return trendData;
        const days = chartRange === '7D' ? 7 : 30;
        return trendData.slice(-days);
    }, [trendData, chartRange]);

    const paymentSplit = stats?.paymentSplit || [
        { name: 'Cash', value: 65, color: '#10B981' },
        { name: 'UPI', value: 35, color: '#3B82F6' },
    ];

    const totalCollected = stats?.totalCollection || 1842500;
    const todaysCollected = stats?.todaysCollection || 142500;
    const pendingAmount = stats?.pendingAmount || 38500;
    const pendingCount = stats?.pendingHouses || 12;
    const campaignTarget = stats?.campaignTarget || 2500000;
    const campaignPercent = Math.min(100, Math.round((totalCollected / campaignTarget) * 100)) || 74;

    if (isLoadingAppData) {
        return (
            <div style={{ padding: '24px 0' }}>
                <div className="skeleton skeleton-text" style={{ width: '280px', height: '28px', marginBottom: '16px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div className="card" style={{ height: '140px' }} />
                    <div className="card" style={{ height: '140px' }} />
                    <div className="card" style={{ height: '140px' }} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
            <Modal
                isOpen={isDonationModalOpen}
                onClose={() => setIsDonationModalOpen(false)}
                title="Record Collection"
            >
                <DonationForm onSuccess={() => setIsDonationModalOpen(false)} />
            </Modal>

            {/* 1. Header & Greeting Bar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-default, rgba(255,255,255,0.06))',
                }}
            >
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary, #FDFBF7)', margin: '0 0 4px' }}>
                        {greeting}, {displayName}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                            style={{
                                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                                color: '#D4AF37',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                            }}
                        >
                            Durga Puja 2026
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted, #9CA3AF)' }}>
                            • Role: <strong style={{ color: 'var(--text-primary)' }}>{displayRole}</strong>
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={toggleUiMode}
                        type="button"
                        style={{
                            minHeight: '40px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            backgroundColor: uiMode === 'simple' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            border: `1px solid ${uiMode === 'simple' ? '#D4AF37' : 'rgba(255, 255, 255, 0.15)'}`,
                            color: uiMode === 'simple' ? '#D4AF37' : 'var(--text-muted, #D1D5DB)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                        }}
                    >
                        <SlidersHorizontal size={15} />
                        Mode: {uiMode === 'simple' ? 'Simple (Quiet)' : 'Standard'}
                    </button>
                </div>
            </div>

            {/* 2. THE 3 CRITICAL QUESTIONS (Numbers First) */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                    marginBottom: '28px',
                }}
            >
                {/* Question 1: How much collected? */}
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface, #1E1B18)',
                        border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Today's Collection
                        </span>
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#34D399',
                            }}
                        >
                            <IndianRupee size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34D399', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                        {fmt(todaysCollected)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted, #9CA3AF)' }}>
                        Lifetime collected: <strong style={{ color: 'var(--text-primary, #FFFFFF)' }}>{fmt(totalCollected)}</strong>
                    </div>
                </div>

                {/* Question 2: How much is pending? */}
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface, #1E1B18)',
                        border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Pending / Due Amount
                        </span>
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#F87171',
                            }}
                        >
                            <Clock size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F87171', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                        {fmt(pendingAmount)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted, #9CA3AF)' }}>
                        Pending across <strong style={{ color: 'var(--text-primary, #FFFFFF)' }}>{pendingCount} households</strong>
                    </div>
                </div>

                {/* Question 3: Campaign Progress */}
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface, #1E1B18)',
                        border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Campaign Target Reached
                        </span>
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#D4AF37',
                            }}
                        >
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#D4AF37', letterSpacing: '-0.02em', marginBottom: '10px' }}>
                        {campaignPercent}%
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${campaignPercent}%`, height: '100%', backgroundColor: '#D4AF37', borderRadius: '999px' }} />
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted, #9CA3AF)', marginTop: '8px' }}>
                        Target: <strong style={{ color: 'var(--text-primary, #FFFFFF)' }}>{fmt(campaignTarget)}</strong>
                    </div>
                </div>
            </div>

            {/* 3. QUICK ACTIONS BAR (Big Touch Targets) */}
            <div
                style={{
                    backgroundColor: 'var(--bg-surface, #1E1B18)',
                    border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '28px',
                }}
            >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                    Quick Actions
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                        gap: '12px',
                    }}
                >
                    <Link
                        to="/donations/new"
                        style={{
                            minHeight: '52px',
                            backgroundColor: '#D4AF37',
                            color: '#111827',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '1rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                        }}
                    >
                        <Plus size={20} />
                        Record Collection
                    </Link>

                    <Link
                        to="/donations?status=PENDING"
                        style={{
                            minHeight: '52px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'var(--text-primary, #FFFFFF)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                        }}
                    >
                        <Clock size={18} />
                        View Pending ({pendingCount})
                    </Link>

                    <Link
                        to="/collectors"
                        style={{
                            minHeight: '52px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'var(--text-primary, #FFFFFF)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                        }}
                    >
                        <Users size={18} />
                        Field Collectors
                    </Link>

                    <Link
                        to="/finance"
                        style={{
                            minHeight: '52px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'var(--text-primary, #FFFFFF)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                        }}
                    >
                        <Landmark size={18} />
                        Cashier Ledger
                    </Link>

                    <Link
                        to="/reports"
                        style={{
                            minHeight: '52px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'var(--text-primary, #FFFFFF)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                        }}
                    >
                        <Printer size={18} />
                        Print Reports
                    </Link>
                </div>
            </div>

            {/* 4. WHAT NEEDS ATTENTION TODAY */}
            <AttentionList
                pendingCount={pendingCount}
                pendingAmount={pendingAmount}
                unreconciledHandovers={2}
                campaignProgressPercent={campaignPercent}
                campaignName="Durga Puja 2026"
            />

            {/* 5. STANDARD / ADVANCED MODE SECTIONS */}
            {uiMode !== 'simple' && (
                <>
                    {/* Charts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                        {/* Collection Trend */}
                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Collection Trend</h3>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {['7D', '30D', 'All'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setChartRange(range)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                backgroundColor: chartRange === range ? '#D4AF37' : 'transparent',
                                                color: chartRange === range ? '#111827' : 'var(--text-muted)',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={filteredTrend} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                                        <defs>
                                            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.01} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: C.mutedText }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: C.mutedText }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area type="monotone" dataKey="amount" stroke="#D4AF37" strokeWidth={2.5} fill="url(#goldGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Payment Mode Distribution */}
                        <div className="card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700 }}>Payment Method Split</h3>
                            <div style={{ height: '240px', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '50%', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={paymentSplit} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                                {paymentSplit.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {paymentSplit.map((item) => (
                                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                                            <span style={{ fontSize: '0.9rem', color: C.warmText, flex: 1 }}>{item.name}</span>
                                            <strong style={{ fontSize: '0.95rem', color: C.warmText }}>{item.value}%</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Collections Ledger & Top Collectors */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                        {/* Recent Collections */}
                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Recent Collections</h3>
                                <Link to="/donations" style={{ fontSize: '0.85rem', color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>
                                    View Full Register →
                                </Link>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(recentDonations || []).slice(0, 5).map((d) => (
                                    <div
                                        key={d.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: C.warmText }}>{d.donor}</div>
                                            <div style={{ fontSize: '0.75rem', color: C.mutedText }}>
                                                {d.mode?.toUpperCase() || 'CASH'} • {d.status === 'paid' ? 'Paid' : 'Pending'}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#D4AF37' }}>
                                            ₹{Number(d.amount).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Collectors */}
                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Collector Performance</h3>
                                <Link to="/collectors" style={{ fontSize: '0.85rem', color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>
                                    All Collectors →
                                </Link>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(collectorRanking || []).slice(0, 4).map((c, i) => (
                                    <div
                                        key={c.name}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            backgroundColor: i === 0 ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${i === 0 ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255,255,255,0.05)'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 800, color: i === 0 ? '#D4AF37' : C.mutedText, width: '18px' }}>
                                                #{i + 1}
                                            </span>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: C.warmText }}>{c.name}</span>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: i === 0 ? '#D4AF37' : C.warmText }}>
                                            {fmt(c.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
