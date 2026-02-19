import { useState, useMemo, useRef } from 'react';
import { Search, Plus, Upload, MapPin, CheckCircle, Clock, X, Home, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/ui/Toast';
import HouseMap from '../components/HouseMap';
import { useAppData } from '../context/AppDataContext';
import { geocodeAddress } from '../utils/geocoding';

function priorityBadge(p) {
    return `badge badge-${p}`;
}

export default function Houses() {
    const { houses, addHouse, toggleHouseCollected } = useAppData();
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [newHouse, setNewHouse] = useState({ address: '', donor: '', phone: '', zone: 'Zone A', priority: 'normal' });
    const [importData, setImportData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileRef = useRef(null);
    const toast = useToast();

    const filtered = useMemo(() => {
        if (!search) return houses;
        const q = search.toLowerCase();
        return houses.filter(h =>
            h.address.toLowerCase().includes(q) ||
            h.donor.toLowerCase().includes(q) ||
            h.zone.toLowerCase().includes(q)
        );
    }, [houses, search]);

    const totalHouses = houses.length;
    const collectedCount = houses.filter(h => h.collected).length;
    const progress = totalHouses > 0 ? Math.round((collectedCount / totalHouses) * 100) : 0;

    const handleAddHouse = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        let coordinates = { lat: 22.5726, lng: 88.3639 }; // Default: Kolkata

        try {
            // Attempt to geocode address
            // Appending ", Kolkata" or similar if needed for better results, but let's try raw first
            const result = await geocodeAddress(newHouse.address);
            if (result) {
                coordinates = result;
            } else {
                toast.warning('Address not found on map. Using default location.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Geocoding failed. Using default location.');
        }

        addHouse({
            ...newHouse,
            lastYear: 0,
            ...coordinates
        });

        setIsSubmitting(false);
        setShowAddModal(false);
        setNewHouse({ address: '', donor: '', phone: '', zone: 'Zone A', priority: 'normal' });
        toast.success('House added successfully!');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const parsed = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const obj = {};
                headers.forEach((h, i) => { obj[h] = values[i] || ''; });
                return obj;
            });
            setImportData(parsed);
            setShowImportModal(true);
        };
        reader.readAsText(file);
    };

    const handleImport = () => {
        if (!importData) return;
        importData.forEach(d => {
            addHouse({
                address: d.address || '',
                donor: d.donor || d.donor_name || '',
                phone: d.phone || '',
                zone: d.zone || 'Zone A',
                lastYear: parseInt(d.last_year || d.lastyear || 0),
                priority: d.priority || 'normal',
                lat: 22.5726, // Default
                lng: 88.3639
            });
        });
        setShowImportModal(false);
        setImportData(null);
        toast.success(`${importData.length} houses imported successfully!`);
    };

    return (
        <>
            {/* Add House Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New House">
                <form onSubmit={handleAddHouse} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                    <div className="form-group">
                        <label className="form-label">Address *</label>
                        <input type="text" className="form-input" placeholder="e.g. 12/A, Main Road" value={newHouse.address}
                            onChange={(e) => setNewHouse({ ...newHouse, address: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Donor Name</label>
                        <input type="text" className="form-input" placeholder="Primary contact name" value={newHouse.donor}
                            onChange={(e) => setNewHouse({ ...newHouse, donor: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input type="tel" className="form-input" placeholder="+91 98765 43210" value={newHouse.phone}
                            onChange={(e) => setNewHouse({ ...newHouse, phone: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                            <label className="form-label">Zone</label>
                            <select className="form-input" value={newHouse.zone} onChange={(e) => setNewHouse({ ...newHouse, zone: e.target.value })}
                                style={{ width: '100%', cursor: 'pointer' }}>
                                <option>Zone A</option>
                                <option>Zone B</option>
                                <option>Zone C</option>
                                <option>Zone D</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select className="form-input" value={newHouse.priority} onChange={(e) => setNewHouse({ ...newHouse, priority: e.target.value })}
                                style={{ width: '100%', cursor: 'pointer' }}>
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '44px' }} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        {isSubmitting ? ' Adding...' : ' Add House'}
                    </button>
                </form>
            </Modal>

            {/* Import CSV Modal */}
            <Modal isOpen={showImportModal} onClose={() => { setShowImportModal(false); setImportData(null); }} title="Import Houses from CSV">
                {importData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Found <strong>{importData.length}</strong> houses in file. Preview:
                        </p>
                        <div className="table-wrapper" style={{ maxHeight: '240px', overflow: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                            <table>
                                <thead>
                                    <tr><th>Address</th><th>Donor</th><th>Zone</th></tr>
                                </thead>
                                <tbody>
                                    {importData.slice(0, 5).map((d, i) => (
                                        <tr key={i}><td>{d.address}</td><td>{d.donor || d.donor_name}</td><td>{d.zone}</td></tr>
                                    ))}
                                    {importData.length > 5 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>...and {importData.length - 5} more</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportData(null); }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleImport}>
                                <Upload size={16} /> Import {importData.length} Houses
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="file-upload-zone" onClick={() => fileRef.current?.click()}>
                        <Upload size={32} />
                        <p>Click to select CSV file</p>
                        <p className="hint">Expected columns: address, donor, phone, zone, priority</p>
                    </div>
                )}
            </Modal>

            <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileUpload} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: 700 }}>Houses</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {collectedCount} of {totalHouses} houses collected ({progress}%)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
                        <Upload size={16} /> Import CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} /> Add House
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Collection Progress</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{progress}%</span>
                </div>
                <div className="progress-bar" style={{ height: '10px' }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <CheckCircle size={14} color="var(--brand-green)" /> {collectedCount} Collected
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <Clock size={14} color="var(--color-warning)" /> {totalHouses - collectedCount} Pending
                    </div>
                </div>
            </div>

            {/* Interactive Google Map */}
            <div className="card" style={{ marginBottom: '20px', overflow: 'hidden' }}>
                <HouseMap houses={houses} height="380px" />
            </div>

            {/* Houses Table */}
            <div className="card">
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ position: 'relative', maxWidth: '320px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search houses, donors..." className="form-input" value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '36px', height: '36px', fontSize: '0.8125rem', width: '100%' }} />
                    </div>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Address</th>
                                <th>Donor</th>
                                <th>Phone</th>
                                <th>Zone</th>
                                <th style={{ textAlign: 'right' }}>Last Year</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="8" className="empty-state"><p>No houses match your search</p></td></tr>
                            ) : filtered.map((h) => (
                                <tr key={h.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MapPin size={14} style={{ color: h.collected ? 'var(--brand-green)' : 'var(--text-muted)', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 500 }}>{h.address}</span>
                                        </div>
                                    </td>
                                    <td>{h.donor}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{h.phone}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{h.zone}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="amount">₹{h.lastYear.toLocaleString('en-IN')}</span>
                                    </td>
                                    <td><span className={priorityBadge(h.priority)}>{h.priority.charAt(0).toUpperCase() + h.priority.slice(1)}</span></td>
                                    <td><span className={`badge ${h.collected ? 'badge-paid' : 'badge-due'}`}>{h.collected ? 'Collected' : 'Pending'}</span></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className={`btn btn-sm ${h.collected ? 'btn-secondary' : 'btn-primary'}`}
                                            onClick={() => toggleHouseCollected(h.id)}
                                            style={{ height: '28px', fontSize: '0.75rem', padding: '0 8px' }}
                                        >
                                            {h.collected ? 'Undo' : 'Mark Collected'}
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
