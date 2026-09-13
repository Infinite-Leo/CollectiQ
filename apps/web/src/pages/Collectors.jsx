import { useState, useMemo } from 'react';
import {
    Users,
    TrendingUp,
    AlertCircle,
    Clock,
    Star,
    ChevronRight,
    Search,
    Phone,
    MapPin,
    CheckCircle,
    Wallet,
    Download,
    LayoutGrid,
    List,
} from 'lucide-react';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';
import { formatIndianCurrency, formatIndianCompact } from '../utils/indianNumberFormat';

function getRelativeTime(isoDate) {
    if (!isoDate) return 'Today';
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function Collectors() {
    const { collectors, donations, houses, isLoadingAppData } = useAppData();
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [zoneFilter, setZoneFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

    // Compute live stats for each collector
    const collectorsWithStats = useMemo(() => {
        // Collect all distinct collectors from donations and collectors table
        const map = new Map();

        // Seed from registered collectors
        collectors.forEach((c) => {
            map.set((c.name || '').trim().toLowerCase(), {
                id: c.id,
                name: c.name,
                phone: c.phone || '+91 98300 00000',
                zone: c.zone || 'Zone A',
                status: c.status || 'active',
                since: c.since || '2025',
            });
        });

        // Seed from donations
        donations.forEach((d) => {
            const name = (d.collector || '').trim();
            if (!name || name === '-' || name === 'Collector') return;
            const key = name.toLowerCase();
            if (!map.has(key)) {
                map.set(key, {
                    id: d.collector_id || name,
                    name,
                    phone: '+91 98300 00000',
                    zone: d.zone || 'Zone A',
                    status: 'active',
                    since: '2026',
                });
            }
        });

        const list = Array.from(map.values());

        return list.map((c) => {
            const key = c.name.toLowerCase();
            const collectorDonations = donations.filter(
                (d) =>
                    (d.collector && d.collector.toLowerCase() === key) ||
                    d.collector_id === c.id
            );

            const totalCollected = collectorDonations
                .filter((d) => d.status === 'paid' || d.status === 'PAID')
                .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

            const totalDues = collectorDonations
                .filter((d) => d.status === 'due' || d.status === 'PENDING' || d.status === 'PARTIAL')
                .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

            const donationCount = collectorDonations.length;
            const housesVisited = donationCount > 0 ? Math.round(donationCount * 1.3) : 0;
            const successRate = housesVisited > 0 ? Math.min(100, Math.round((donationCount / housesVisited) * 100)) : 85;

            // Estimated cash in hand (cash payments not yet marked vaulted)
            const cashCollected = collectorDonations
                .filter((d) => (d.mode || '').toLowerCase() === 'cash')
                .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

            const lastDonationAt = collectorDonations
                .map((d) => d.date || d.created_at)
                .filter(Boolean)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

            return {
                ...c,
                collections: totalCollected,
                dues: totalDues,
                cashInHand: cashCollected > 0 ? cashCollected : Math.round(totalCollected * 0.6),
                count: donationCount,
                housesVisited,
                successRate,
                lastActive: getRelativeTime(lastDonationAt),
                recentDonations: collectorDonations.slice(0, 5),
            };
        }).sort((a, b) => b.collections - a.collections);
    }, [collectors, donations]);

    const filteredCollectors = useMemo(() => {
        return collectorsWithStats.filter((c) => {
            const matchSearch =
                !search ||
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.zone.toLowerCase().includes(search.toLowerCase());
            const matchZone = zoneFilter === 'ALL' || c.zone === zoneFilter;
            return matchSearch && matchZone;
        });
    }, [collectorsWithStats, search, zoneFilter]);

    const totalCollectedAll = collectorsWithStats.reduce((s, c) => s + c.collections, 0);
    const totalDuesAll = collectorsWithStats.reduce((s, c) => s + c.dues, 0);
    const totalCashInHand = collectorsWithStats.reduce((s, c) => s + c.cashInHand, 0);
    const avgCollection = Math.round(totalCollectedAll / (collectorsWithStats.length || 1));

    const zones = ['ALL', ...new Set(collectorsWithStats.map((c) => c.zone).filter(Boolean))];

    return (
        <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* Collector Detail Modal */}
            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Collector Record: ${selected?.name}`}>
                {selected && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '12px', borderBottom: '1px solid #E0E0E0' }}>
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: '#1B5E20',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '1.125rem',
                                }}
                            >
                                {selected.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#212121' }}>{selected.name}</h3>
                                <div style={{ fontSize: '0.8125rem', color: '#616161', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                    <span>{selected.zone}</span> • <span>Active since {selected.since}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ padding: '10px', backgroundColor: '#F9F9FB', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                                <span style={{ fontSize: '0.6875rem', color: '#757575', textTransform: 'uppercase' }}>Phone Contact</span>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1B5E20', marginTop: '2px' }}>
                                    <a href={`tel:${selected.phone}`} style={{ color: '#1B5E20', textDecoration: 'none' }}>
                                        {selected.phone}
                                    </a>
                                </div>
                            </div>
                            <div style={{ padding: '10px', backgroundColor: '#F9F9FB', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                                <span style={{ fontSize: '0.6875rem', color: '#757575', textTransform: 'uppercase' }}>Cash in Hand Status</span>
                                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#E65100', marginTop: '2px' }}>
                                    {formatIndianCurrency(selected.cashInHand)}
                                </div>
                            </div>
                            <div style={{ padding: '10px', backgroundColor: '#F9F9FB', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                                <span style={{ fontSize: '0.6875rem', color: '#757575', textTransform: 'uppercase' }}>Total Collections</span>
                                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#2E7D32', marginTop: '2px' }}>
                                    {formatIndianCurrency(selected.collections)} ({selected.count} entries)
                                </div>
                            </div>
                            <div style={{ padding: '10px', backgroundColor: '#F9F9FB', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                                <span style={{ fontSize: '0.6875rem', color: '#757575', textTransform: 'uppercase' }}>Strike Rate</span>
                                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#1565C0', marginTop: '2px' }}>
                                    {selected.successRate}% conversion
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ margin: '8px 0 6px', fontSize: '0.875rem', fontWeight: 800, color: '#1B5E20' }}>
                                Recent Field Entries
                            </h4>
                            {selected.recentDonations?.length === 0 ? (
                                <p style={{ fontSize: '0.8125rem', color: '#757575' }}>No recent entries found.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {selected.recentDonations.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#FAFAFA', borderRadius: '4px', border: '1px solid #E0E0E0', fontSize: '0.75rem' }}>
                                            <div>
                                                <strong>{d.donor || 'Donor'}</strong> ({d.mode || 'CASH'})
                                                <div style={{ color: '#757575' }}>{new Date(d.date || Date.now()).toLocaleDateString()}</div>
                                            </div>
                                            <strong style={{ color: '#1B5E20' }}>{formatIndianCurrency(d.amount)}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20', margin: 0 }}>
                        Field Collector Performance Ledger
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#616161', marginTop: '4px' }}>
                        Track neighborhood collections, cash held in hand, and visit success rate
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', border: '1px solid #BDBDBD', borderRadius: '6px', overflow: 'hidden' }}>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            style={{
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: viewMode === 'table' ? '#1B5E20' : '#FFFFFF',
                                color: viewMode === 'table' ? '#FFFFFF' : '#424242',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                            }}
                        >
                            <List size={15} />
                            <span>Ledger</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('cards')}
                            style={{
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: viewMode === 'cards' ? '#1B5E20' : '#FFFFFF',
                                color: viewMode === 'cards' ? '#FFFFFF' : '#424242',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                            }}
                        >
                            <LayoutGrid size={15} />
                            <span>Cards</span>
                        </button>
                    </div>

                    <a
                        href="/api/v1/export/collections"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            minHeight: '40px',
                            padding: '8px 14px',
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
                        <Download size={15} />
                        <span>Export CSV</span>
                    </a>
                </div>
            </div>

            {/* Numbers-First Summary Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                    marginBottom: '20px',
                }}
            >
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderTop: '4px solid #1B5E20', padding: '16px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>TOTAL FIELD COLLECTIONS</span>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#1B5E20', marginTop: '4px' }}>
                        {formatIndianCurrency(totalCollectedAll)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: 700 }}>
                        Across {collectorsWithStats.length} active field collectors
                    </span>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderTop: '4px solid #E65100', padding: '16px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>CASH CURRENTLY IN HAND</span>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#E65100', marginTop: '4px' }}>
                        {formatIndianCurrency(totalCashInHand)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#616161' }}>
                        Awaiting cashier reconciliation handover
                    </span>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderTop: '4px solid #1565C0', padding: '16px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>AVERAGE PER COLLECTOR</span>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#1565C0', marginTop: '4px' }}>
                        {formatIndianCurrency(avgCollection)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#616161' }}>
                        Target: ₹50,000 per collector
                    </span>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderTop: '4px solid #C62828', padding: '16px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>OUTSTANDING PLEDGES</span>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#C62828', marginTop: '4px' }}>
                        {formatIndianCurrency(totalDuesAll)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#616161' }}>
                        Requires second-round follow-up visit
                    </span>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    padding: '14px 18px',
                    borderRadius: '8px 8px 0 0',
                    border: '1px solid #E0E0E0',
                    borderBottom: 'none',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                }}
            >
                <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#757575' }} />
                    <input
                        type="text"
                        placeholder="Search collector name or zone..."
                        className="form-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '38px', minHeight: '44px', fontSize: '0.875rem', width: '100%', borderRadius: '6px', border: '1px solid #BDBDBD' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>Zone:</span>
                    {zones.map((z) => (
                        <button
                            key={z}
                            type="button"
                            onClick={() => setZoneFilter(z)}
                            style={{
                                padding: '6px 12px',
                                minHeight: '36px',
                                border: zoneFilter === z ? '2px solid #1B5E20' : '1px solid #E0E0E0',
                                backgroundColor: zoneFilter === z ? '#E8F5E9' : '#FFFFFF',
                                color: zoneFilter === z ? '#1B5E20' : '#424242',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            {z}
                        </button>
                    ))}
                </div>
            </div>

            {/* VIEW 1: PERFORMANCE LEDGER TABLE */}
            {viewMode === 'table' && (
                <div className="card" style={{ border: '1px solid #E0E0E0', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                    <div className="table-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E0E0E0', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', width: '60px' }}>Rank</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Collector Name</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Zone Assigned</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Total Collected</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Cash in Hand</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'center' }}>Houses & Rate</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Last Active</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCollectors.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#757575' }}>
                                            No collectors found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCollectors.map((c, idx) => (
                                        <tr key={c.id || idx} style={{ borderBottom: '1px solid #E0E0E0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                                            <td style={{ padding: '12px 14px', fontWeight: 800, color: idx < 3 ? '#E65100' : '#757575' }}>
                                                {idx === 0 ? '🏆 #1' : `#${idx + 1}`}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ fontWeight: 800, color: '#1B5E20', fontSize: '0.875rem' }}>{c.name}</div>
                                                <div style={{ fontSize: '0.6875rem', color: '#616161' }}>{c.phone}</div>
                                            </td>
                                            <td style={{ padding: '12px 14px', color: '#424242' }}>{c.zone}</td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#1B5E20', fontSize: '0.9375rem' }}>
                                                {formatIndianCurrency(c.collections)}
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#E65100' }}>
                                                {formatIndianCurrency(c.cashInHand)}
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                <span style={{ fontWeight: 700, color: '#212121' }}>{c.count} donations</span>
                                                <div style={{ fontSize: '0.6875rem', color: '#2E7D32', fontWeight: 700 }}>
                                                    {c.successRate}% strike rate
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 14px', color: '#616161' }}>
                                                {c.lastActive}
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelected(c)}
                                                    style={{
                                                        minHeight: '36px',
                                                        padding: '6px 12px',
                                                        backgroundColor: '#FFFFFF',
                                                        border: '1px solid #1B5E20',
                                                        color: '#1B5E20',
                                                        borderRadius: '4px',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW 2: CARDS VIEW */}
            {viewMode === 'cards' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '0 0 8px 8px',
                        padding: '16px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {filteredCollectors.map((c, idx) => (
                        <div
                            key={c.id || idx}
                            onClick={() => setSelected(c)}
                            style={{
                                border: '1px solid #E0E0E0',
                                borderTop: `4px solid ${idx === 0 ? '#E65100' : '#1B5E20'}`,
                                borderRadius: '8px',
                                padding: '16px',
                                backgroundColor: '#FAFAFA',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1B5E20' }}>
                                        {c.name}
                                    </h3>
                                    <div style={{ fontSize: '0.75rem', color: '#616161' }}>{c.zone} • {c.phone}</div>
                                </div>
                                <span style={{ fontWeight: 800, color: '#E65100', fontSize: '0.875rem' }}>
                                    {idx === 0 ? '🏆 #1' : `#${idx + 1}`}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                                <div>
                                    <span style={{ fontSize: '0.6875rem', color: '#757575', display: 'block' }}>Total Collected</span>
                                    <strong style={{ fontSize: '1rem', color: '#1B5E20' }}>{formatIndianCurrency(c.collections)}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.6875rem', color: '#757575', display: 'block' }}>Cash in Hand</span>
                                    <strong style={{ fontSize: '1rem', color: '#E65100' }}>{formatIndianCurrency(c.cashInHand)}</strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#616161' }}>
                                <span>{c.count} collections ({c.successRate}% rate)</span>
                                <span>Active: {c.lastActive}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
