import {
    IndianRupee,
    TrendingUp,
    Users,
    Home,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
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
    CartesianGrid,
} from 'recharts';
import Modal from '../components/Modal';
import DonationForm from '../components/DonationForm';
import { useAppData } from '../context/AppDataContext';

// ── Custom Tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#1A1A1A',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
            <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '4px' }}>{label}</div>
            <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>
                ₹{payload[0].value.toLocaleString('en-IN')}
            </div>
        </div>
    );
}

// ── Dashboard ────────────────────────────────────────────────────
export default function Dashboard() {
    const {
        stats, trendData, collectorRanking, recentDonations, addDonation, addDonor,
    } = useAppData();

    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [chartRange, setChartRange] = useState('7D');

    // Compute KPIs from live stats
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

    // Filter trend data based on chart range
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
                            <kpi.icon size={22} />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-label">{kpi.label}</div>
                            <div className="kpi-value">
                                {kpi.label.includes('Collection') && <span className="currency">₹</span>}
                                {kpi.value}
                            </div>
                            <span className={`kpi-delta ${kpi.deltaUp ? 'up' : 'down'}`}>
                                {kpi.deltaUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
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
                        <div className="toggle-group" style={{ width: 'auto' }}>
                            {['7D', '30D', 'All'].map(range => (
                                <button
                                    key={range}
                                    className={`toggle-option ${chartRange === range ? 'active' : ''}`}
                                    onClick={() => setChartRange(range)}
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
                                        <stop offset="0%" stopColor="#D97706" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#D97706"
                                    strokeWidth={2.5}
                                    fill="url(#saffronGrad)"
                                    dot={{ r: 4, fill: '#D97706', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, fill: '#D97706', strokeWidth: 2, stroke: '#fff' }}
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
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {paymentSplit.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [`${value}%`, '']}
                                        contentStyle={{
                                            background: '#1A1A1A',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '0.8125rem',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {paymentSplit.map((item) => (
                                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '3px',
                                        background: item.color,
                                        flexShrink: 0,
                                    }} />
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', flex: 1 }}>
                                        {item.name}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                        {item.value}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Collector Ranking + Recent Donations */}
            <div className="charts-grid">
                {/* Collector Ranking */}
                <div className="card">
                    <div className="card-header">
                        <h3>Top Collectors</h3>
                        <Link to="/collectors" className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
                            View all →
                        </Link>
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {collectorRanking.map((c, i) => (
                            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: i === 0 ? 'var(--accent-gold-light)' : 'var(--border-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: i === 0 ? '#92400E' : 'var(--text-secondary)',
                                    flexShrink: 0,
                                }}>
                                    {i + 1}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.name}</span>
                                        <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                                            ₹{c.amount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${(c.amount / maxCollectorAmount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Donations */}
                <div className="card">
                    <div className="card-header">
                        <h3>Recent Donations</h3>
                        <button onClick={() => setIsDonationModalOpen(true)} className="btn btn-primary" style={{ height: '34px', fontSize: '0.8125rem' }}>
                            <Plus size={16} />
                            New Donation
                        </button>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Donor</th>
                                    <th>Amount</th>
                                    <th>Mode</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentDonations.map((d) => (
                                    <tr key={d.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{d.donor}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.receipt}</div>
                                        </td>
                                        <td>
                                            <span className="amount">₹{d.amount.toLocaleString('en-IN')}</span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${d.mode === 'upi' ? 'upi' : 'cash'}`}>
                                                {d.mode === 'upi' ? 'UPI' : d.mode === 'cash' ? 'Cash' : 'Bank'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${d.status}`}>
                                                {d.status === 'paid' ? 'Paid' : 'Due'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                                            {d.time}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
