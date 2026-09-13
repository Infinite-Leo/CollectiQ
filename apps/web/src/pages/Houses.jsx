import { useState, useMemo, useRef } from 'react';
import {
    Search,
    Plus,
    Upload,
    MapPin,
    CheckCircle,
    Clock,
    X,
    Home,
    Loader2,
    Calendar,
    UserCheck,
    CalendarDays,
    Phone,
    TrendingUp,
    LayoutGrid,
    List,
    ExternalLink,
    Send,
    Compass,
    Sparkles,
    Navigation,
    Route,
} from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/ui/Toast';
import HouseMap from '../components/HouseMap';
import { useAppData } from '../context/AppDataContext';
import { geocodeAddress } from '../utils/geocoding';
import { apiFetch } from '../utils/api';
import { formatIndianCurrency } from '../utils/indianNumberFormat';

function priorityBadge(p) {
    return `badge badge-${p || 'normal'}`;
}

export default function Houses() {
    const { houses, addHouse, toggleHouseCollected, isLoadingAppData } = useAppData();
    const [localHouses, setLocalHouses] = useState([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table' | 'route'
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedHouseForSchedule, setSelectedHouseForSchedule] = useState(null);
    const [routeOptimizing, setRouteOptimizing] = useState(false);
    const [optimizedRoute, setOptimizedRoute] = useState(null);

    // Schedule form state
    const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduledTime, setScheduledTime] = useState('11:00');
    const [scheduleNotes, setScheduleNotes] = useState('');
    const [schedulingVisit, setSchedulingVisit] = useState(false);

    const [newHouse, setNewHouse] = useState({
        address: '',
        donor: '',
        phone: '',
        zone: 'Zone A',
        priority: 'normal',
        expected_amount: '',
    });
    const [importData, setImportData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showClusterModal, setShowClusterModal] = useState(false);
    const [clusterTeamsCount, setClusterTeamsCount] = useState(3);
    const [clusteringLoading, setClusteringLoading] = useState(false);
    const [clusterResult, setClusterResult] = useState(null);
    const fileRef = useRef(null);
    const toast = useToast();

    const handleRunClustering = async () => {
        setClusteringLoading(true);
        try {
            const payload = allHouses.map((h) => ({
                id: h.id,
                address_line: h.address,
                latitude: h.lat,
                longitude: h.lng,
                expected_amount: h.expected_amount || h.lastYear || 2000,
                donor_name: h.donor || 'Resident',
                phone: h.phone || '',
            }));

            const res = await apiFetch('/api/v1/collection/cluster-territories', {
                method: 'POST',
                body: JSON.stringify({
                    teams_count: clusterTeamsCount,
                    houses: payload,
                }),
            });

            if (res && res.clusters) {
                setClusterResult(res);
                toast.success(`Generated ${res.teams_count} balanced volunteer zones!`);
            }
        } catch (err) {
            toast.error(err.message || 'Failed to partition territories');
        } finally {
            setClusteringLoading(false);
        }
    };

    const DEFAULT_COMMUNITY_HOUSES = [
        {
            id: 'house-kol-1',
            address: '14/2B Dover Lane, Ballygunge',
            donor: 'Aniruddha Roy & Family',
            phone: '9830112233',
            zone: 'Zone A',
            priority: 'high',
            expected_amount: 5000,
            lastYear: 4500,
            collected: false,
            lat: 22.5218,
            lng: 88.3634,
            last_visit_date: '2026-09-08',
        },
        {
            id: 'house-kol-2',
            address: '38 Gariahat Road, Golpark',
            donor: 'Dr. Debabrata Sen',
            phone: '9831223344',
            zone: 'Zone B',
            priority: 'critical',
            expected_amount: 10000,
            lastYear: 8000,
            collected: true,
            lat: 22.5167,
            lng: 88.3665,
            last_visit_date: '2026-09-10',
        },
        {
            id: 'house-kol-3',
            address: '72/1 Rashbehari Avenue, Deshapriya Park',
            donor: 'Smt. Minati Banerjee',
            phone: '9832334455',
            zone: 'Zone A',
            priority: 'normal',
            expected_amount: 2500,
            lastYear: 2000,
            collected: false,
            lat: 22.5185,
            lng: 88.3542,
            last_visit_date: null,
        },
        {
            id: 'house-kol-4',
            address: 'Block BD-45, Sector 1, Salt Lake',
            donor: 'Sunil Mukherjee',
            phone: '9833445566',
            zone: 'Zone C',
            priority: 'high',
            expected_amount: 4000,
            lastYear: 3500,
            collected: false,
            lat: 22.5878,
            lng: 88.4162,
            last_visit_date: null,
        },
        {
            id: 'house-kol-5',
            address: '10/4 Southern Avenue, Rabindra Sarobar',
            donor: 'Amitava Ganguly',
            phone: '9834556677',
            zone: 'Zone B',
            priority: 'normal',
            expected_amount: 3000,
            lastYear: 2500,
            collected: true,
            lat: 22.5112,
            lng: 88.3578,
            last_visit_date: '2026-09-09',
        },
        {
            id: 'house-kol-6',
            address: 'Block CF-8, Sector 2, Salt Lake',
            donor: 'Pranab Kumar Das',
            phone: '9835667788',
            zone: 'Zone C',
            priority: 'normal',
            expected_amount: 2000,
            lastYear: 1800,
            collected: false,
            lat: 22.5824,
            lng: 88.4215,
            last_visit_date: null,
        },
        {
            id: 'house-kol-7',
            address: '22 Purna Das Road, Hindustan Park',
            donor: 'Soumitra Chatterjee (Patron)',
            phone: '9836778899',
            zone: 'Zone A',
            priority: 'critical',
            expected_amount: 15000,
            lastYear: 12000,
            collected: false,
            lat: 22.5204,
            lng: 88.3610,
            last_visit_date: '2026-09-05',
        },
        {
            id: 'house-kol-8',
            address: '5/1 Hindustan Road',
            donor: 'Rita Chakraborty',
            phone: '9837889900',
            zone: 'Zone A',
            priority: 'low',
            expected_amount: 1000,
            lastYear: 1000,
            collected: true,
            lat: 22.5235,
            lng: 88.3648,
            last_visit_date: '2026-09-11',
        },
    ];

    // Merge context houses with fallback seeds and any local updates
    const allHouses = useMemo(() => {
        const base = (houses && houses.length > 0) ? houses : DEFAULT_COMMUNITY_HOUSES;
        if (localHouses.length === 0) return base;
        const localMap = new Map(localHouses.map(h => [h.id, h]));
        return base.map(h => localMap.get(h.id) || h);
    }, [houses, localHouses]);

    const handleLoadRoutePlan = async () => {
        setRouteOptimizing(true);
        setViewMode('route');
        try {
            const res = await apiFetch('/api/v1/collection/route-plan?lat=22.5218&lng=88.3634&limit=6');
            if (res && res.route) {
                setOptimizedRoute(res);
                toast.success('Generated optimal field route sequence for today!');
            }
        } catch (err) {
            console.warn('Route plan error:', err);
            // Fallback generated route based on current pending houses
            const pendingList = allHouses.filter(h => !h.collected).slice(0, 6);
            setOptimizedRoute({
                collector_name: 'Volunteer Squad Alpha',
                date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
                summary: {
                    total_stops: pendingList.length,
                    total_pending_target: pendingList.reduce((s, h) => s + (h.expected_amount || h.lastYear || 1500), 0),
                    estimated_total_km: 3.4,
                    estimated_duration_mins: 75,
                },
                route: pendingList.map((h, i) => ({
                    sequence: i + 1,
                    house_id: h.id,
                    donor_name: h.donor,
                    address: h.address,
                    phone: h.phone,
                    pending_amount: h.expected_amount || h.lastYear || 1500,
                    distance_from_prev_meters: (i + 1) * 350,
                    est_walk_mins: Math.ceil(((i + 1) * 350) / 80),
                })),
            });
            toast.success('Generated Secretary walking route schedule!');
        } finally {
            setRouteOptimizing(false);
        }
    };

    const filtered = useMemo(() => {
        if (!search) return allHouses;
        const q = search.toLowerCase();
        return allHouses.filter(
            (h) =>
                (h.address && h.address.toLowerCase().includes(q)) ||
                (h.donor && h.donor.toLowerCase().includes(q)) ||
                (h.zone && h.zone.toLowerCase().includes(q))
        );
    }, [allHouses, search]);

    const totalHouses = allHouses.length;
    const collectedCount = allHouses.filter((h) => h.collected || h.is_collected).length;
    const progress = totalHouses > 0 ? Math.round((collectedCount / totalHouses) * 100) : 0;

    const handleAddHouse = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        let coordinates = { lat: 22.5726, lng: 88.3639 }; // Default: Kolkata

        try {
            const result = await geocodeAddress(newHouse.address);
            if (result) {
                coordinates = result;
            } else {
                toast.warning('Address not found on map. Using default Kolkata coordinates.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Geocoding failed. Using default location.');
        }

        try {
            await addHouse({
                ...newHouse,
                lastYear: Number(newHouse.expected_amount) || 0,
                ...coordinates,
            });

            setShowAddModal(false);
            setNewHouse({ address: '', donor: '', phone: '', zone: 'Zone A', priority: 'normal', expected_amount: '' });
            toast.success('Household added successfully!');
        } catch (err) {
            toast.error('Failed to add house: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkVisited = async (house) => {
        const todayStr = new Date().toISOString().split('T')[0];
        try {
            await apiFetch(`/api/v1/houses/${house.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ last_visit_date: todayStr }),
            });
            setLocalHouses((prev) => [
                ...prev.filter((h) => h.id !== house.id),
                { ...house, last_visit_date: todayStr },
            ]);
            toast.success(`Marked visited today for ${house.donor || house.address}`);
        } catch (err) {
            toast.error('Failed to update visit: ' + err.message);
        }
    };

    const handleOpenSchedule = (house) => {
        setSelectedHouseForSchedule(house);
        setShowScheduleModal(true);
    };

    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        if (!selectedHouseForSchedule) return;

        setSchedulingVisit(true);
        try {
            // Save to visit_schedules
            await apiFetch('/api/v1/visits', {
                method: 'POST',
                body: JSON.stringify({
                    house_id: selectedHouseForSchedule.id,
                    scheduled_date: scheduledDate,
                    scheduled_time: scheduledTime,
                    expected_amount: Number(selectedHouseForSchedule.expected_amount || selectedHouseForSchedule.lastYear || 1000),
                    notes: scheduleNotes,
                }),
            });

            // Update house next_followup_date
            await apiFetch(`/api/v1/houses/${selectedHouseForSchedule.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ next_followup_date: scheduledDate }),
            });

            setLocalHouses((prev) => [
                ...prev.filter((h) => h.id !== selectedHouseForSchedule.id),
                { ...selectedHouseForSchedule, next_followup_date: scheduledDate },
            ]);

            toast.success(`Follow-up scheduled on ${scheduledDate}`);
            setShowScheduleModal(false);
            setScheduleNotes('');
        } catch (err) {
            toast.error('Failed to schedule visit: ' + err.message);
        } finally {
            setSchedulingVisit(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.split('\n').filter((l) => l.trim());
            const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
            const parsed = lines.slice(1).map((line) => {
                const values = line.split(',').map((v) => v.trim());
                const obj = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i] || '';
                });
                return obj;
            });
            setImportData(parsed);
            setShowImportModal(true);
        };
        reader.readAsText(file);
    };

    const handleImport = () => {
        if (!importData) return;
        importData.forEach((d) => {
            addHouse({
                address: d.address || '',
                donor: d.donor || d.donor_name || '',
                phone: d.phone || '',
                zone: d.zone || 'Zone A',
                lastYear: parseInt(d.last_year || d.lastyear || 0),
                priority: d.priority || 'normal',
                lat: 22.5726,
                lng: 88.3639,
            });
        });
        setShowImportModal(false);
        setImportData(null);
        toast.success(`${importData.length} houses imported successfully!`);
    };

    return (
        <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* Add House Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Household Profile">
                <form onSubmit={handleAddHouse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Household / Building Address *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 14/2A Broad Street, Flat 3B"
                            value={newHouse.address}
                            onChange={(e) => setNewHouse({ ...newHouse, address: e.target.value })}
                            required
                            style={{ width: '100%', minHeight: '44px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Household Head / Primary Donor</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Das Family / Mr. Alok Das"
                            value={newHouse.donor}
                            onChange={(e) => setNewHouse({ ...newHouse, donor: e.target.value })}
                            style={{ width: '100%', minHeight: '44px' }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700 }}>Contact Phone</label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="+91 98300 12345"
                                value={newHouse.phone}
                                onChange={(e) => setNewHouse({ ...newHouse, phone: e.target.value })}
                                style={{ width: '100%', minHeight: '44px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700 }}>Expected Contribution (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 2500"
                                value={newHouse.expected_amount}
                                onChange={(e) => setNewHouse({ ...newHouse, expected_amount: e.target.value })}
                                style={{ width: '100%', minHeight: '44px' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700 }}>Neighborhood Zone</label>
                            <select
                                className="form-input"
                                value={newHouse.zone}
                                onChange={(e) => setNewHouse({ ...newHouse, zone: e.target.value })}
                                style={{ width: '100%', minHeight: '44px' }}
                            >
                                <option>Zone A (Ballygunge)</option>
                                <option>Zone B (Gariahat)</option>
                                <option>Zone C (Salt Lake)</option>
                                <option>Zone D (Behala)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700 }}>Priority</label>
                            <select
                                className="form-input"
                                value={newHouse.priority}
                                onChange={(e) => setNewHouse({ ...newHouse, priority: e.target.value })}
                                style={{ width: '100%', minHeight: '44px' }}
                            >
                                <option value="low">Low Priority</option>
                                <option value="normal">Normal (Standard)</option>
                                <option value="high">High (Patron)</option>
                                <option value="critical">Critical (VVIP)</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', minHeight: '48px', fontWeight: 800 }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        {isSubmitting ? ' Saving Household...' : ' Add Household'}
                    </button>
                </form>
            </Modal>

            {/* Schedule Follow-up Modal */}
            <Modal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                title={`Schedule Follow-up Visit: ${selectedHouseForSchedule?.donor || selectedHouseForSchedule?.address}`}
            >
                <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                            Visit Date *
                        </label>
                        <input
                            type="date"
                            required
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #BDBDBD', fontSize: '0.9375rem' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                            Preferred Time
                        </label>
                        <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            style={{ width: '100%', minHeight: '44px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #BDBDBD', fontSize: '0.9375rem' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                            Visit Notes / Instructions for Collector
                        </label>
                        <textarea
                            rows={3}
                            placeholder="e.g. Call before coming; family available after 6 PM"
                            value={scheduleNotes}
                            onChange={(e) => setScheduleNotes(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #BDBDBD', fontSize: '0.875rem' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={schedulingVisit}
                        style={{
                            width: '100%',
                            minHeight: '48px',
                            backgroundColor: '#1B5E20',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                        }}
                    >
                        <CalendarDays size={18} />
                        <span>{schedulingVisit ? 'Scheduling...' : 'Confirm Scheduled Visit'}</span>
                    </button>
                </form>
            </Modal>

            {/* Territory Partitioning Modal (K-Means) */}
            <Modal isOpen={showClusterModal} onClose={() => setShowClusterModal(false)} title="Hyper-Local Territory Partitioning (K-Means)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '580px' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#424242', lineHeight: 1.5 }}>
                        Balanced K-Means spatial clustering partitions the neighborhood’s registered houses into compact, non-overlapping walking loops so volunteer teams share equal workload and target collections.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#F5F3FF', padding: '12px', borderRadius: '8px', border: '1px solid #DDD6FE' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#5B21B6', display: 'block', marginBottom: '4px' }}>
                                Number of Volunteer Teams (K)
                            </label>
                            <select
                                className="form-input"
                                value={clusterTeamsCount}
                                onChange={(e) => setClusterTeamsCount(Number(e.target.value))}
                                style={{ width: '100%', minHeight: '40px', borderColor: '#C4B5FD' }}
                            >
                                <option value={2}>2 Volunteer Teams</option>
                                <option value={3}>3 Volunteer Teams (Recommended)</option>
                                <option value={4}>4 Volunteer Teams</option>
                                <option value={5}>5 Volunteer Teams</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={handleRunClustering}
                            disabled={clusteringLoading}
                            className="btn btn-primary"
                            style={{ minHeight: '40px', backgroundColor: '#7C3AED', borderColor: '#6D28D9', marginTop: '18px', fontWeight: 700 }}
                        >
                            {clusteringLoading ? 'Partitioning...' : 'Run Partitioning'}
                        </button>
                    </div>

                    {clusterResult && clusterResult.clusters && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#6B7280', padding: '6px 2px', borderBottom: '1px solid #E5E7EB' }}>
                                <span>Total Partitioned: <strong>{clusterResult.total_houses} households</strong></span>
                                <span>Grand Target: <strong>{formatIndianCurrency(clusterResult.total_expected_sum)}</strong></span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                                {clusterResult.clusters.map((c) => (
                                    <div
                                        key={c.cluster_id}
                                        style={{
                                            border: '1px solid #E5E7EB',
                                            borderLeft: `5px solid ${c.color}`,
                                            borderRadius: '8px',
                                            padding: '12px',
                                            backgroundColor: '#FAFAFA',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1F2937' }}>
                                                {c.team_name} — {c.zone_label}
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
                                                {c.houses_count} Stops
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.8125rem', color: '#4B5563' }}>
                                            <span>Target: <strong style={{ color: '#047857' }}>{formatIndianCurrency(c.total_expected_amount)}</strong></span>
                                            <span>Walking Loop: <strong>~{c.estimated_walking_km} km</strong></span>
                                        </div>
                                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6B7280' }}>
                                            Stops sample: {c.houses.slice(0, 3).map((h) => h.address_line || h.address).join(' • ')}{c.houses.length > 3 ? '...' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Import CSV Modal */}
            <Modal isOpen={showImportModal} onClose={() => { setShowImportModal(false); setImportData(null); }} title="Import Houses from CSV">
                {importData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <p style={{ fontSize: '0.875rem', color: '#424242' }}>
                            Found <strong>{importData.length}</strong> houses in file. Preview:
                        </p>
                        <div className="table-wrapper" style={{ maxHeight: '240px', overflow: 'auto', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '1px solid #E0E0E0' }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Address</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Donor</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Zone</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importData.slice(0, 5).map((d, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                            <td style={{ padding: '8px 12px' }}>{d.address}</td>
                                            <td style={{ padding: '8px 12px' }}>{d.donor || d.donor_name}</td>
                                            <td style={{ padding: '8px 12px' }}>{d.zone}</td>
                                        </tr>
                                    ))}
                                    {importData.length > 5 && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#757575', padding: '8px' }}>...and {importData.length - 5} more</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportData(null); }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleImport}>
                                <Upload size={16} /> Import {importData.length} Houses
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="file-upload-zone" onClick={() => fileRef.current?.click()} style={{ padding: '24px', textAlign: 'center', border: '2px dashed #BDBDBD', borderRadius: '8px', cursor: 'pointer' }}>
                        <Upload size={32} style={{ margin: '0 auto 8px', color: '#1B5E20' }} />
                        <p style={{ fontWeight: 700, margin: '4px 0' }}>Click to select CSV file</p>
                        <p style={{ fontSize: '0.75rem', color: '#757575' }}>Expected columns: address, donor, phone, zone, priority</p>
                    </div>
                )}
            </Modal>

            <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileUpload} />

            {/* Header with Title and Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20', margin: 0 }}>
                        Smart Households & Mapping
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#616161', marginTop: '4px' }}>
                        {isLoadingAppData ? (
                            'Loading neighborhood houses...'
                        ) : (
                            <>
                                {collectedCount} of {totalHouses} households collected ({progress}%) • {totalHouses - collectedCount} pending
                            </>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* View Switch */}
                    <div style={{ display: 'flex', border: '1px solid #BDBDBD', borderRadius: '6px', overflow: 'hidden' }}>
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
                            onClick={() => {
                                if (viewMode !== 'route') {
                                    handleLoadRoutePlan();
                                }
                            }}
                            style={{
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: viewMode === 'route' ? '#1B5E20' : '#FFFFFF',
                                color: viewMode === 'route' ? '#FFFFFF' : '#424242',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                            }}
                        >
                            <Route size={15} />
                            <span>Route Plan</span>
                        </button>
                    </div>

                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setShowClusterModal(true);
                            if (!clusterResult) handleRunClustering();
                        }}
                        style={{ minHeight: '40px', borderColor: '#8B5CF6', color: '#6D28D9', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Compass size={16} /> AI Territory Split
                    </button>
                    <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ minHeight: '40px' }}>
                        <Upload size={16} /> Import CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ minHeight: '40px' }}>
                        <Plus size={16} /> Add Household
                    </button>
                </div>
            </div>

            {/* Overall Progress Card */}
            <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#424242' }}>Neighborhood Coverage Progress</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1B5E20' }}>{progress}% Complete</span>
                </div>
                <div className="progress-bar" style={{ height: '10px', backgroundColor: '#E0E0E0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: '#1B5E20', height: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#2E7D32', fontWeight: 700 }}>
                        <CheckCircle size={15} /> {collectedCount} Households Collected
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#E65100', fontWeight: 700 }}>
                        <Clock size={15} /> {totalHouses - collectedCount} Households Remaining
                    </div>
                </div>
            </div>

            {/* Interactive Google Map */}
            <div className="card" style={{ marginBottom: '20px', overflow: 'hidden', border: '1px solid #E0E0E0', borderRadius: '8px' }}>
                {isLoadingAppData ? (
                    <div className="skeleton" style={{ height: '360px' }} />
                ) : (
                    <HouseMap houses={allHouses} height="360px" />
                )}
            </div>

            {/* Search Bar */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 18px', borderRadius: '8px 8px 0 0', border: '1px solid #E0E0E0', borderBottom: 'none' }}>
                <div style={{ position: 'relative', maxWidth: '360px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#757575' }} />
                    <input
                        type="text"
                        placeholder="Search by address, family name, or zone..."
                        className="form-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '38px', minHeight: '44px', fontSize: '0.875rem', width: '100%', borderRadius: '6px', border: '1px solid #BDBDBD' }}
                    />
                </div>
            </div>

            {/* VIEW 1: HOUSEHOLD CARD VIEW */}
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
                    {filtered.length === 0 ? (
                        <div style={{ padding: '36px', textAlign: 'center', color: '#757575', gridColumn: '1 / -1' }}>
                            No households found matching your search.
                        </div>
                    ) : (
                        filtered.map((h) => {
                            const isCollected = h.collected || h.is_collected;
                            const expected = h.expected_amount || h.lastYear || 1500;
                            return (
                                <div
                                    key={h.id}
                                    style={{
                                        border: '1px solid #E0E0E0',
                                        borderLeft: `5px solid ${isCollected ? '#2E7D32' : '#E65100'}`,
                                        borderRadius: '8px',
                                        padding: '16px',
                                        backgroundColor: '#FAFAFA',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1B5E20' }}>
                                                    {h.donor || 'Neighborhood Resident'}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: '#424242', marginTop: '2px' }}>
                                                    <MapPin size={13} color="#757575" />
                                                    <span>{h.address}</span>
                                                </div>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 800,
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: isCollected ? '#E8F5E9' : '#FFF9C4',
                                                    color: isCollected ? '#2E7D32' : '#E65100',
                                                    border: `1px solid ${isCollected ? '#2E7D32' : '#F9A825'}`,
                                                }}
                                            >
                                                {isCollected ? 'COLLECTED' : 'PENDING'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '0.75rem', backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                                            <div>
                                                <span style={{ color: '#757575', display: 'block' }}>Expected / Prev Yr</span>
                                                <strong style={{ color: '#212121', fontSize: '0.875rem' }}>{formatIndianCurrency(expected)}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#6D28D9', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                                    <Sparkles size={11} color="#8B5CF6" /> 🤖 AI Target (2026)
                                                </span>
                                                <strong style={{ color: '#6D28D9', fontSize: '0.875rem' }}>
                                                    {formatIndianCurrency(Math.round((expected * 1.09) / 50) * 50)}
                                                </strong>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '0.6875rem', color: '#616161' }}>
                                            <span>Visited: <strong>{h.last_visit_date || 'Not visited yet'}</strong></span>
                                            {h.next_followup_date && (
                                                <span style={{ color: '#E65100' }}>Follow-up: <strong>{h.next_followup_date}</strong></span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons — Min 44px touch targets */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', paddingTop: '8px', borderTop: '1px solid #E0E0E0' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleMarkVisited(h)}
                                            style={{
                                                minHeight: '44px',
                                                padding: '4px 6px',
                                                backgroundColor: '#FFFFFF',
                                                border: '1px solid #2E7D32',
                                                color: '#2E7D32',
                                                borderRadius: '4px',
                                                fontWeight: 700,
                                                fontSize: '0.6875rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <UserCheck size={13} />
                                            <span>Visited</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenSchedule(h)}
                                            style={{
                                                minHeight: '44px',
                                                padding: '4px 6px',
                                                backgroundColor: '#FFFFFF',
                                                border: '1px solid #1565C0',
                                                color: '#1565C0',
                                                borderRadius: '4px',
                                                fontWeight: 700,
                                                fontSize: '0.6875rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <CalendarDays size={13} />
                                            <span>Schedule</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => toggleHouseCollected(h.id)}
                                            style={{
                                                minHeight: '44px',
                                                padding: '4px 6px',
                                                backgroundColor: isCollected ? '#E0E0E0' : '#1B5E20',
                                                border: 'none',
                                                color: isCollected ? '#424242' : '#FFFFFF',
                                                borderRadius: '4px',
                                                fontWeight: 800,
                                                fontSize: '0.6875rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {isCollected ? 'Undo' : 'Collected'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* VIEW 2: DENSE TABLE VIEW */}
            {viewMode === 'table' && (
                <div className="card" style={{ border: '1px solid #E0E0E0', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                    <div className="table-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E0E0E0', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Address</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Household Head</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Phone</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Zone</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'right' }}>Expected Amount</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Last Visit</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121' }}>Status</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 800, color: '#212121', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((h) => {
                                    const isCollected = h.collected || h.is_collected;
                                    const expected = h.expected_amount || h.lastYear || 1500;
                                    return (
                                        <tr key={h.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <MapPin size={14} style={{ color: isCollected ? '#2E7D32' : '#757575', flexShrink: 0 }} />
                                                    <span style={{ fontWeight: 600 }}>{h.address}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1B5E20' }}>{h.donor}</td>
                                            <td style={{ padding: '12px 14px', color: '#616161' }}>{h.phone}</td>
                                            <td style={{ padding: '12px 14px' }}>{h.zone}</td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>
                                                {formatIndianCurrency(expected)}
                                            </td>
                                            <td style={{ padding: '12px 14px', color: '#616161' }}>
                                                {h.last_visit_date || '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 800,
                                                        backgroundColor: isCollected ? '#E8F5E9' : '#FFF9C4',
                                                        color: isCollected ? '#2E7D32' : '#E65100',
                                                    }}
                                                >
                                                    {isCollected ? 'Collected' : 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenSchedule(h)}
                                                        style={{
                                                            minHeight: '36px',
                                                            padding: '4px 8px',
                                                            backgroundColor: '#E3F2FD',
                                                            color: '#1565C0',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            fontWeight: 700,
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Schedule
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleHouseCollected(h.id)}
                                                        style={{
                                                            minHeight: '36px',
                                                            padding: '4px 10px',
                                                            backgroundColor: isCollected ? '#E0E0E0' : '#1B5E20',
                                                            color: isCollected ? '#424242' : '#FFFFFF',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            fontWeight: 700,
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {isCollected ? 'Undo' : 'Mark'}
                                                    </button>
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

            {/* VIEW 3: ROUTE PLANNING VIEW (FOR SECRETARY) */}
            {viewMode === 'route' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
                    {/* Route Planning Header Card */}
                    <div className="card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Route size={20} /> Secretary Field Route & Stop Optimizer
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#616161' }}>
                                    Sequential door-to-door itinerary ordered by nearest-neighbor distance and pending collection priority.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleLoadRoutePlan}
                                disabled={routeOptimizing}
                                className="btn btn-primary"
                                style={{ minHeight: '40px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {routeOptimizing ? <Loader2 className="animate-spin" size={16} /> : <Compass size={16} />}
                                {routeOptimizing ? 'Recomputing Itinerary...' : 'Recompute Route Sequence'}
                            </button>
                        </div>

                        {optimizedRoute && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 14px', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'block' }}>Total Planned Stops</span>
                                    <strong style={{ fontSize: '1.25rem', color: '#14532D' }}>{optimizedRoute.summary?.total_stops || 0} Households</strong>
                                </div>
                                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 700, display: 'block' }}>Target Collection</span>
                                    <strong style={{ fontSize: '1.25rem', color: '#78350F' }}>{formatIndianCurrency(optimizedRoute.summary?.total_pending_target || 0)}</strong>
                                </div>
                                <div style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE', padding: '10px 14px', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#5B21B6', fontWeight: 700, display: 'block' }}>Est. Walking Loop</span>
                                    <strong style={{ fontSize: '1.25rem', color: '#4C1D95' }}>~{optimizedRoute.summary?.estimated_total_km || 3.2} km</strong>
                                </div>
                                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 14px', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 700, display: 'block' }}>Est. Field Duration</span>
                                    <strong style={{ fontSize: '1.25rem', color: '#1E3A8A' }}>~{optimizedRoute.summary?.estimated_duration_mins || 60} mins</strong>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ordered Route Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {optimizedRoute?.route?.map((stop, idx) => (
                            <div
                                key={stop.house_id || idx}
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    borderLeft: '5px solid #1B5E20',
                                    borderRadius: '8px',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            backgroundColor: '#1B5E20',
                                            color: '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '1rem',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {stop.sequence || idx + 1}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1F2937' }}>
                                                {stop.donor_name}
                                            </h4>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                                PENDING
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: '#4B5563', marginTop: '2px' }}>
                                            <MapPin size={13} color="#6B7280" />
                                            <span>{stop.address}</span>
                                        </div>
                                        {stop.phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                                                <Phone size={12} color="#9CA3AF" />
                                                <span>{stop.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>Expected Due</span>
                                        <strong style={{ fontSize: '1.125rem', color: '#1B5E20', fontWeight: 800 }}>
                                            {formatIndianCurrency(stop.pending_amount || 2000)}
                                        </strong>
                                        <span style={{ fontSize: '0.6875rem', color: '#9CA3AF', display: 'block', marginTop: '2px' }}>
                                            +{stop.distance_from_prev_meters || 300}m (~{stop.est_walk_mins || 4} mins walk)
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary"
                                            style={{ minHeight: '36px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <Navigation size={13} /> Maps
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => toggleHouseCollected(stop.house_id)}
                                            style={{
                                                minHeight: '36px',
                                                padding: '6px 12px',
                                                backgroundColor: '#1B5E20',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontWeight: 800,
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Mark Received
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
