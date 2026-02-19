import { useState, useMemo } from 'react';
import { Plus, Search, Download, Filter, ChevronDown, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import DonationForm from '../components/DonationForm';
import { useToast } from '../components/ui/Toast';
import { useAppData } from '../context/AppDataContext';

function formatDate(isoDate) {
    try { return new Date(isoDate).toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return isoDate; }
}

function exportCSV(data) {
    const headers = ['Receipt', 'Donor', 'Collector', 'Zone', 'Amount', 'Mode', 'Status', 'Date'];
    const rows = data.map(d => [d.receipt, d.donor, d.collector, d.zone, d.amount, d.mode, d.status, d.date]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Donations() {
    const { donations } = useAppData();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [zoneFilter, setZoneFilter] = useState('');
    const [modeFilter, setModeFilter] = useState('');
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [showNewDonation, setShowNewDonation] = useState(false);
    const toast = useToast();

    const filtered = useMemo(() => {
        let result = donations;
        if (filter !== 'all') result = result.filter(d => d.status === filter);
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(d =>
                d.donor.toLowerCase().includes(q) ||
                d.receipt.toLowerCase().includes(q) ||
                (d.collector && d.collector.toLowerCase().includes(q))
            );
        }
        if (zoneFilter) result = result.filter(d => d.zone === zoneFilter);
        if (modeFilter) result = result.filter(d => d.mode === modeFilter);
        return result;
    }, [donations, filter, search, zoneFilter, modeFilter]);

    return (
        <>
            {/* Donation Detail Modal */}
            <Modal isOpen={!!selectedDonation} onClose={() => setSelectedDonation(null)} title="Donation Details">
                {selectedDonation && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Receipt #</span>
                                <span className="value" style={{ fontFamily: 'var(--font-mono)' }}>{selectedDonation.receipt}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Amount</span>
                                <span className="value" style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                    ₹{selectedDonation.amount.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Donor</span>
                                <span className="value">{selectedDonation.donor}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Collector</span>
                                <span className="value">{selectedDonation.collector}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Zone</span>
                                <span className="value">{selectedDonation.zone}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Date</span>
                                <span className="value">{selectedDonation.date}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Payment Mode</span>
                                <span className="value">
                                    <span className={`badge badge-${selectedDonation.mode === 'upi' ? 'upi' : selectedDonation.mode === 'cash' ? 'cash' : 'bank_transfer'}`}>
                                        {selectedDonation.mode === 'upi' ? 'UPI' : selectedDonation.mode === 'cash' ? 'Cash' : 'Bank Transfer'}
                                    </span>
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Status</span>
                                <span className="value">
                                    <span className={`badge badge-${selectedDonation.status}`}>
                                        {selectedDonation.status === 'paid' ? 'Paid' : 'Due'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* New Donation Modal */}
            <Modal isOpen={showNewDonation} onClose={() => setShowNewDonation(false)} title="New Donation">
                <DonationForm onSuccess={() => {
                    toast.success('Donation recorded successfully!');
                    setShowNewDonation(false);
                }} />
            </Modal>

            {/* Page Title Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: 700 }}>Donations</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {filtered.length} donations · ₹{filtered.reduce((s, d) => s + d.amount, 0).toLocaleString('en-IN')} collected
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => { exportCSV(filtered); toast.success('CSV exported successfully'); }}>
                        <Download size={16} />
                        Export
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowNewDonation(true)}>
                        <Plus size={16} />
                        New Donation
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by donor, receipt, collector..."
                            className="form-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '36px', height: '36px', fontSize: '0.8125rem', width: '100%' }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="toggle-group" style={{ width: 'auto' }}>
                        {['all', 'paid', 'due'].map((f) => (
                            <button
                                key={f}
                                className={`toggle-option ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? 'All' : f === 'paid' ? 'Paid' : 'Due'}
                            </button>
                        ))}
                    </div>

                    <button
                        className={`btn ${showFilters ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.8125rem' }}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        More Filters
                        <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: showFilters ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="filter-panel">
                        <div className="form-group">
                            <label className="form-label">Zone</label>
                            <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
                                <option value="">All Zones</option>
                                <option value="Zone A">Zone A</option>
                                <option value="Zone B">Zone B</option>
                                <option value="Zone C">Zone C</option>
                                <option value="Zone D">Zone D</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Payment Mode</label>
                            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
                                <option value="">All Modes</option>
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-ghost"
                                style={{ height: '36px', fontSize: '0.8125rem' }}
                                onClick={() => { setZoneFilter(''); setModeFilter(''); setShowFilters(false); }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Donations Table */}
            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Receipt #</th>
                                <th>Donor</th>
                                <th>Collector</th>
                                <th>Zone</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Mode</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="empty-state">
                                        <p>No donations match your filters</p>
                                    </td>
                                </tr>
                            ) : filtered.map((d) => (
                                <tr key={d.id}>
                                    <td>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 500 }}>
                                            {d.receipt}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{d.donor}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{d.collector}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{d.zone}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="amount">₹{d.amount.toLocaleString('en-IN')}</span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${d.mode === 'upi' ? 'upi' : d.mode === 'cash' ? 'cash' : 'bank_transfer'}`}>
                                            {d.mode === 'upi' ? 'UPI' : d.mode === 'cash' ? 'Cash' : 'Bank'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${d.status}`}>
                                            {d.status === 'paid' ? 'Paid' : 'Due'}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                                        {d.date}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ height: '30px', padding: '0 8px' }}
                                            onClick={() => setSelectedDonation(d)}
                                            title="View details"
                                        >
                                            <Eye size={16} />
                                        </button>
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
