import { useState, useMemo } from 'react';
import { Users, TrendingUp, AlertCircle, Clock, Star, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';

export default function Collectors() {
    const { collectors, donations } = useAppData();
    const [selected, setSelected] = useState(null);

    // Compute live stats for each collector
    const collectorsWithStats = useMemo(() => {
        return collectors.map(c => {
            const collectorDonations = donations.filter(d =>
                d.collector === c.name || (d.collector === 'You' && c.name === 'Ravi Kumar') // Assuming 'You' is Ravi for demo
            );

            const totalCollected = collectorDonations
                .filter(d => d.status === 'paid')
                .reduce((sum, d) => sum + d.amount, 0);

            const totalDues = collectorDonations
                .filter(d => d.status === 'due')
                .reduce((sum, d) => sum + d.amount, 0);

            const count = collectorDonations.length;
            const lastActive = 'Just now'; // Simplified for demo

            return {
                ...c,
                collections: totalCollected,
                dues: totalDues,
                count,
                lastActive
            };
        }).sort((a, b) => b.collections - a.collections);
    }, [collectors, donations]);

    const activeCount = collectorsWithStats.filter(c => c.status === 'active').length;
    const avgCollection = Math.round(
        collectorsWithStats.reduce((s, c) => s + c.collections, 0) / (collectorsWithStats.length || 1)
    );
    const totalDues = collectorsWithStats.reduce((s, c) => s + c.dues, 0);
    const maxCollection = Math.max(...collectorsWithStats.map(c => c.collections), 1);

    return (
        <>
            {/* Collector Detail Modal */}
            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Collector Details">
                {selected && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                        {/* Profile section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: 'var(--radius-full)',
                                background: 'linear-gradient(135deg, var(--brand-saffron), var(--accent-gold))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700, fontSize: '1.125rem',
                            }}>
                                {selected.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{selected.name}</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{selected.zone} · Member since {selected.since}</div>
                            </div>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Phone</span>
                                <span className="value" style={{ fontFamily: 'var(--font-mono)' }}>{selected.phone}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Status</span>
                                <span className="value">
                                    <span className={`badge ${selected.status === 'active' ? 'badge-active' : selected.status === 'idle' ? 'badge-cash' : 'badge-draft'}`}>
                                        {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                                    </span>
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Total Collected</span>
                                <span className="value" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{selected.collections.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Donations</span>
                                <span className="value">{selected.count}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Avg per Donation</span>
                                <span className="value" style={{ fontFamily: 'var(--font-mono)' }}>
                                    ₹{selected.count > 0 ? Math.round(selected.collections / selected.count).toLocaleString('en-IN') : 0}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Outstanding Dues</span>
                                <span className="value" style={{ color: 'var(--color-error)', fontWeight: 600 }}>₹{selected.dues.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Last Active</span>
                                <span className="value">{selected.lastActive}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Zone Coverage</span>
                                <span className="value">{selected.zone}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: 700 }}>Collectors</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Monitor field team performance and progress.
                    </p>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                <div className="kpi-card saffron">
                    <div className="kpi-icon saffron"><Users size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-label">Active Now</div>
                        <div className="kpi-value">{activeCount}</div>
                    </div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-icon green"><TrendingUp size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-label">Avg. Collection</div>
                        <div className="kpi-value"><span className="currency">₹</span>{avgCollection.toLocaleString('en-IN')}</div>
                    </div>
                </div>
                <div className="kpi-card error">
                    <div className="kpi-icon error"><AlertCircle size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-label">Total Dues</div>
                        <div className="kpi-value"><span className="currency">₹</span>{totalDues.toLocaleString('en-IN')}</div>
                    </div>
                </div>
            </div>

            {/* Collector Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
                {collectorsWithStats.map((c, index) => (
                    <div
                        key={c.id}
                        className="card"
                        style={{ padding: '20px', cursor: 'pointer', transition: 'all var(--transition-normal)' }}
                        onClick={() => setSelected(c)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: 'var(--radius-full)',
                                    background: `linear-gradient(135deg, ${index < 3 ? 'var(--brand-saffron)' : 'var(--text-muted)'}, ${index < 3 ? 'var(--accent-gold)' : 'var(--border-default)'})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: index < 3 ? 'white' : 'var(--text-primary)',
                                    fontWeight: 700, fontSize: '0.875rem',
                                    boxShadow: index < 3 ? 'var(--shadow-saffron)' : 'none',
                                }}>
                                    {c.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {c.name}
                                        {index === 0 && <Star size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.zone}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={`badge ${c.status === 'active' ? 'badge-active' : c.status === 'idle' ? 'badge-cash' : 'badge-draft'}`}>
                                    {c.status === 'active' ? '● Active' : c.status === 'idle' ? 'Idle' : 'Inactive'}
                                </span>
                                <ChevronRight size={14} color="var(--text-muted)" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                            <div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collected</div>
                                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9375rem' }}>₹{(c.collections / 1000).toFixed(1)}K</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Donations</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{c.count}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dues</div>
                                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', color: c.dues > 0 ? 'var(--color-error)' : 'var(--text-secondary)' }}>₹{(c.dues / 1000).toFixed(1)}K</div>
                            </div>
                        </div>

                        <div className="progress-bar" style={{ height: '6px' }}>
                            <div className="progress-fill" style={{ width: `${(c.collections / maxCollection) * 100}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                <Clock size={10} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{c.lastActive}
                            </span>
                            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                {maxCollection > 0 ? Math.round((c.collections / maxCollection) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

const collectorsData = [
    // Keeping this just in case, but unused now
];
