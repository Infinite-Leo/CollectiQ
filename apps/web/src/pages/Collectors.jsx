import { useState, useMemo } from 'react';
import { Users, TrendingUp, AlertCircle, Clock, Star, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';

function getRelativeTime(isoDate) {
    if (!isoDate) return '-';
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function Collectors() {
    const { collectors, donations, isLoadingAppData } = useAppData();
    const [selected, setSelected] = useState(null);

    const derivedCollectors = useMemo(() => {
        const map = new Map();
        donations.forEach((d) => {
            const name = (d.collector || '').trim();
            if (!name || name === '-' || name === 'Collector') return;
            const date = d.date || d.created_at || null;
            const entry = map.get(name) || {
                id: name,
                name,
                phone: '-',
                status: 'active',
                since: '-',
                zone: d.zone || 'Unassigned',
                lastDonationAt: date,
            };
            if (!entry.zone || entry.zone === 'Unassigned') {
                entry.zone = d.zone || entry.zone;
            }
            if (date && (!entry.lastDonationAt || new Date(date) > new Date(entry.lastDonationAt))) {
                entry.lastDonationAt = date;
            }
            map.set(name, entry);
        });
        return Array.from(map.values());
    }, [donations]);

    const collectorByName = useMemo(() => {
        const map = new Map();
        collectors.forEach((c) => {
            map.set((c.name || '').trim().toLowerCase(), c);
        });
        return map;
    }, [collectors]);

    // Compute live stats for each collector
    const collectorsWithStats = useMemo(() => {
        return derivedCollectors.map(c => {
            const matchingCollector = collectorByName.get((c.name || '').trim().toLowerCase());
            const mergedCollector = {
                ...c,
                ...matchingCollector,
                name: matchingCollector?.name || c.name,
            };
            const collectorDonations = donations.filter(d =>
                d.collector_id === mergedCollector.id || d.collector === mergedCollector.name
            );

            const totalCollected = collectorDonations
                .filter(d => d.status === 'paid')
                .reduce((sum, d) => sum + d.amount, 0);

            const totalDues = collectorDonations
                .filter(d => d.status === 'due')
                .reduce((sum, d) => sum + d.amount, 0);

            const count = collectorDonations.length;
            const lastDonationAt = collectorDonations
                .map(d => d.date || d.created_at)
                .filter(Boolean)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
            const lastActive = getRelativeTime(lastDonationAt || mergedCollector.lastDonationAt);
            const isRecent = lastDonationAt ? (Date.now() - new Date(lastDonationAt).getTime()) < 1000 * 60 * 60 * 24 : false;
            const status = mergedCollector.status || (isRecent ? 'active' : 'idle');

            return {
                ...mergedCollector,
                collections: totalCollected,
                dues: totalDues,
                count,
                lastActive,
                status
            };
        }).sort((a, b) => b.collections - a.collections);
    }, [collectorByName, derivedCollectors, donations]);

    const activeCount = collectorsWithStats.filter(c => c.status === 'active').length;
    const avgCollection = Math.round(
        collectorsWithStats.reduce((s, c) => s + c.collections, 0) / (collectorsWithStats.length || 1)
    );
    const totalDues = collectorsWithStats.reduce((s, c) => s + c.dues, 0);
    const maxCollection = Math.max(...collectorsWithStats.map(c => c.collections), 1);
    const showEmptyState = !isLoadingAppData && collectorsWithStats.length === 0;

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
                    <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.375rem', fontWeight: 700, color: '#2C1A0E' }}>Collectors</h2>
                    <p style={{ fontFamily: 'Sora', fontSize: '0.875rem', color: '#7A5A3A', marginTop: '4px' }}>
                        Monitor field team performance and progress.
                    </p>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                {isLoadingAppData ? (
                    <>
                        <div className="kpi-card saffron">
                            <div className="kpi-icon saffron"><Users size={20} /></div>
                            <div className="kpi-content">
                                <div className="kpi-label">Active Now</div>
                                <div className="skeleton skeleton-text" style={{ width: '80px', height: '18px' }} />
                            </div>
                        </div>
                        <div className="kpi-card green">
                            <div className="kpi-icon green"><TrendingUp size={20} /></div>
                            <div className="kpi-content">
                                <div className="kpi-label">Avg. Collection</div>
                                <div className="skeleton skeleton-text" style={{ width: '100px', height: '18px' }} />
                            </div>
                        </div>
                        <div className="kpi-card error">
                            <div className="kpi-icon error"><AlertCircle size={20} /></div>
                            <div className="kpi-content">
                                <div className="kpi-label">Total Dues</div>
                                <div className="skeleton skeleton-text" style={{ width: '100px', height: '18px' }} />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
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
                    </>
                )}
            </div>

            {/* Collector Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
                {isLoadingAppData ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                        <div key={`collector-skeleton-${idx}`} className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '999px' }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                                    <div className="skeleton skeleton-text" style={{ width: '40%', height: '12px' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                                <div className="skeleton skeleton-text" />
                                <div className="skeleton skeleton-text" />
                                <div className="skeleton skeleton-text" />
                            </div>
                            <div className="skeleton" style={{ height: '6px' }} />
                        </div>
                    ))
                ) : showEmptyState ? (
                    <div className="card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                        <div style={{ fontWeight: 700, marginBottom: '6px' }}>No collectors yet</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Create collectors in your club to start tracking performance here.
                        </div>
                    </div>
                ) : (
                    collectorsWithStats.map((c, index) => (
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
                    ))
                )}
            </div>
        </>
    );
}
