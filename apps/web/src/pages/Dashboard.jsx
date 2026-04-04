import {
    IndianRupee,
    TrendingUp,
    Users,
    Home,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Star,
    Package2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
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
import { useAppData } from '../context/AppDataContext';

// ── Design colors matching reference ─────────────────────────────
// Text/background colors use CSS variables so dark mode works automatically
const C = {
    saffron: '#C97B2A',
    saffronLight: '#E8963A',
    gold: '#D4AF37',
    cream: 'var(--bg-page)',
    ivory: 'var(--bg-surface)',
    warmText: 'var(--text-primary)',
    mutedText: 'var(--text-muted)',
    forest: '#1E5C3A',
    forestLight: '#2D8A58',
    crimson: '#8B1A1A',
    cardBg: 'var(--bg-surface)',
    border: 'var(--border-default)',
    shadow: 'var(--shadow-md)',
};

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

// ── Expense pie data ─────────────────────────────────────────────
const expenseData = [
    { name: 'Decoration', value: 270000, color: '#E8963A' },
    { name: 'Lighting & Sound', value: 322850, color: '#C97B2A' },
    { name: 'Idol', value: 165000, color: '#D4AF37' },
    { name: 'Pandal Setup', value: 95000, color: '#C46B3E' },
    { name: 'Prasad', value: 60500, color: '#2D8A58' },
    { name: 'Permissions', value: 22000, color: '#8B1A1A' },
];

// ── Custom Tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: C.cardBg,
            border: `1px solid ${C.border}`,
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: C.shadow,
            fontFamily: 'Sora',
        }}>
            <div style={{ color: C.mutedText, fontSize: '0.75rem', marginBottom: '4px' }}>{label}</div>
            <div style={{ color: C.warmText, fontSize: '0.875rem', fontWeight: 700 }}>
                {fmt(payload[0].value)}
            </div>
        </div>
    );
}

// ── Dashboard ────────────────────────────────────────────────────
export default function Dashboard() {
    const {
        stats, trendData, collectorRanking, recentDonations,
    } = useAppData();

    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [chartRange, setChartRange] = useState('7D');

    const kpiData = useMemo(() => [
        {
            label: 'Total Collection',
            value: stats.totalCollection.toLocaleString('en-IN'),
            delta: `${stats.totalDonations} donations`,
            deltaUp: true,
            icon: IndianRupee,
            accent: 'saffron',
        },
        {
            label: 'Today\'s Collection',
            value: stats.todaysCollection.toLocaleString('en-IN'),
            delta: stats.todaysCollection > 0 ? 'Active' : 'No collections yet',
            deltaUp: stats.todaysCollection > 0,
            icon: TrendingUp,
            accent: 'green',
        },
        {
            label: 'Active Collectors',
            value: String(stats.activeCollectors),
            delta: `${stats.activeCollectors} in field`,
            deltaUp: true,
            icon: Users,
            accent: 'gold',
        },
        {
            label: 'Pending Houses',
            value: String(stats.pendingHouses),
            delta: `${Math.round((stats.collectedHouses / stats.totalHouses) * 100)}% done`,
            deltaUp: false,
            icon: Home,
            accent: 'error',
        },
    ], [stats]);

    const filteredTrend = useMemo(() => {
        if (chartRange === 'All') return trendData;
        const days = chartRange === '7D' ? 7 : 30;
        return trendData.slice(-days);
    }, [trendData, chartRange]);

    const maxCollectorAmount = useMemo(() =>
        Math.max(...collectorRanking.map(c => c.amount), 1),
        [collectorRanking]
    );

    const paymentSplit = stats.paymentSplit;

    return (
        <>
            <Modal
                isOpen={isDonationModalOpen}
                onClose={() => setIsDonationModalOpen(false)}
                title="New Donation"
            >
                <DonationForm onSuccess={() => {
                    setIsDonationModalOpen(false);
                }} />
            </Modal>

            {/* KPI Cards */}
            <div className="kpi-grid">
                {kpiData.map((kpi) => (
                    <div key={kpi.label} className={`kpi-card ${kpi.accent}`}>
                        <div className={`kpi-icon ${kpi.accent}`}>
                            <kpi.icon size={20} />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-label">{kpi.label}</div>
                            <div className="kpi-value">
                                {kpi.label.includes('Collection') && <span className="currency">₹</span>}
                                {kpi.value}
                            </div>
                            <span className={`kpi-delta ${kpi.deltaUp ? 'up' : 'down'}`}>
                                {kpi.deltaUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                                {kpi.delta}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="charts-grid">
                {/* Collection Trend */}
                <div className="card">
                    <div className="card-header">
                        <h3>Collection Trend</h3>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['7D', '30D', 'All'].map(range => (
                                <button
                                    key={range}
                                    className={`toggle-option ${chartRange === range ? 'active' : ''}`}
                                    onClick={() => setChartRange(range)}
                                    style={{ flex: 'none', padding: '6px 12px' }}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body" style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredTrend} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                                <defs>
                                    <linearGradient id="saffronGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={C.saffron} stopOpacity={0.22} />
                                        <stop offset="95%" stopColor={C.saffron} stopOpacity={0.01} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontFamily: 'Sora', fontSize: 11, fill: C.mutedText }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontFamily: 'Sora', fontSize: 10, fill: C.mutedText }}
                                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke={C.saffron}
                                    strokeWidth={2.5}
                                    fill="url(#saffronGrad)"
                                    dot={{ r: 4, fill: C.saffron, strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: C.saffron }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Split */}
                <div className="card">
                    <div className="card-header">
                        <h3>Payment Split</h3>
                    </div>
                    <div className="card-body" style={{ height: '280px', display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '50%', height: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentSplit}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={58}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {paymentSplit.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [`${value}%`, '']}
                                        contentStyle={{
                                            background: C.cardBg,
                                            border: `1px solid ${C.border}`,
                                            borderRadius: '10px',
                                            fontFamily: 'Sora',
                                            fontSize: '0.8125rem',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {paymentSplit.map((item) => (
                                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: item.color,
                                        flexShrink: 0,
                                    }} />
                                    <span style={{ fontFamily: 'Sora', fontSize: '0.8125rem', color: C.warmText, flex: 1 }}>
                                        {item.name}
                                    </span>
                                    <span style={{ fontFamily: 'Sora', fontSize: '0.8125rem', fontWeight: 700, color: C.warmText }}>
                                        {item.value}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Expense Breakdown + Recent + Leaderboard */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 340px', gap: 18, marginBottom: 22 }}>
                {/* Expense Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <h3>Expense Breakdown</h3>
                        <Link to="/reports" style={{ fontFamily: 'Sora', fontSize: 12, color: C.saffron, fontWeight: 600, textDecoration: 'none' }}>Details →</Link>
                    </div>
                    <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <ResponsiveContainer width="45%" height={160}>
                            <PieChart>
                                <Pie data={expenseData} cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" dataKey="value" strokeWidth={0} paddingAngle={2}>
                                    {expenseData.map((e) => <Cell key={e.name} fill={e.color} />)}
                                </Pie>
                                <Tooltip formatter={(value) => [fmt(value), '']} contentStyle={{ fontFamily: 'Sora', fontSize: 13, borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                            {expenseData.map((e) => (
                                <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                                    <span style={{ fontFamily: 'Sora', fontSize: 12, color: C.warmText, flex: 1 }}>{e.name}</span>
                                    <span style={{ fontFamily: 'Sora', fontSize: 12, fontWeight: 700, color: C.warmText }}>{fmt(e.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Donations */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header">
                        <h3>Recent Donations</h3>
                        <button onClick={() => setIsDonationModalOpen(true)} className="btn btn-primary" style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem', borderRadius: 8 }}>
                            <Plus size={14} style={{ marginRight: 4 }} />
                            New
                        </button>
                    </div>
                    <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
                        <table style={{ minWidth: '300px' }}>
                            <tbody>
                                {recentDonations.slice(0, 5).map((d) => (
                                    <tr key={d.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${C.saffron}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Package2 size={16} color={C.saffron} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: '0.8125rem', color: C.warmText, marginBottom: 2 }}>{d.donor}</span>
                                                    <span style={{ fontSize: '0.6875rem', color: C.mutedText }}>{d.mode === 'upi' ? 'UPI' : 'Cash'} • {d.status === 'paid' ? 'Paid' : 'Due'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'middle' }}>
                                            <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: '0.875rem', color: C.warmText }}>₹{d.amount.toLocaleString('en-IN')}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Link to="/donations" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontFamily: 'Sora', fontSize: 12, color: C.mutedText, textDecoration: 'none', fontWeight: 500 }}>
                            View All Donations
                        </Link>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="card">
                    <div className="card-header">
                        <h3>Leaderboard</h3>
                        <Star size={14} color={C.gold} fill={C.gold} />
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {collectorRanking.map((c, i) => (
                            <div key={c.name} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12,
                                background: i === 0 ? `linear-gradient(135deg, ${C.gold}14, ${C.saffron}09)` : 'transparent',
                                border: `1px solid ${i === 0 ? C.gold + '28' : 'transparent'}`,
                            }}>
                                <div style={{ width: 22, textAlign: 'center', fontFamily: 'Playfair Display', fontSize: 13, fontWeight: 700, color: i === 0 ? C.gold : C.mutedText }}>{i + 1}</div>
                                <div style={{ fontSize: 22 }}>{i === 0 ? '👨🏽' : i === 1 ? '👩🏽' : i === 2 ? '👨🏽‍💼' : '👩🏽‍🦱'}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 600, color: C.warmText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: i === 0 ? C.saffron : C.warmText }}>{fmt(c.amount)}</div>
                                </div>
                            </div>
                        ))}
                        {/* Upcoming Event Banner */}
                        <div style={{ marginTop: 12, padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronLight})`, textAlign: 'center', cursor: 'pointer', boxShadow: `0 4px 14px ${C.saffron}35` }}>
                            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: 'white' }}>🪷 Lakshmi Puja</div>
                            <div style={{ fontFamily: 'Sora', fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Upcoming · Begins in 5 days</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
