import { useState, useEffect } from 'react';
import {
    IndianRupee,
    TrendingUp,
    Wallet,
    QrCode,
    Send,
    Edit3,
    CheckCircle,
    MapPin,
    Smartphone,
    Navigation,
    Calendar,
    Sparkles,
    AlertTriangle,
    ShieldCheck,
    X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { formatIndianCurrency, formatIndianCompact } from '../utils/indianNumberFormat';
import CollectorMap from '../components/CollectorMap';
import OfflineIndicator from '../components/OfflineIndicator';
import ReceiptModal from '../components/ReceiptModal';
import { Route, CalendarDays, ExternalLink, Printer } from 'lucide-react';

// Available events for community festival operations
const FESTIVAL_CAMPAIGNS = [
    { id: 'camp-dp-2026', name: 'Durga Puja 2026', target: 700000 },
    { id: 'camp-kp-2026', name: 'Kali Puja 2026', target: 450000 },
    { id: 'camp-sp-2026', name: 'Saraswati Puja 2026', target: 150000 },
];

export default function CollectorDashboard() {
    const { user } = useAuth();
    const collectorName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Souvik';

    // Time of day greeting
    const [greeting, setGreeting] = useState('Good morning');
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    // Selected event campaign
    const [selectedCampaign, setSelectedCampaign] = useState(FESTIVAL_CAMPAIGNS[0]);

    // Active tab: 'form' | 'chat' | 'map'
    const [activeTab, setActiveTab] = useState('form');

    // 4-box summary statistics
    const [summary, setSummary] = useState({
        collected_today: 18500,
        target_progress: { current: 542500, target: 700000, percent: 78 },
        cash_in_hand: 12400,
        upi_settlements: { count: 14, total: 6100 },
    });

    // Browser GPS coordinates
    const [gpsLocation, setGpsLocation] = useState({ lat: 22.5354, lng: 88.3652 });
    const [gpsCaptured, setGpsCaptured] = useState(true);

    // Capture device GPS
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setGpsCaptured(true);
                },
                (err) => {
                    console.warn('GPS location permission notice:', err.message);
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    }, []);

    // Route Planning & Scheduled Visits State
    const [routePlan, setRoutePlan] = useState(null);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [visits, setVisits] = useState([]);
    const [loadingVisits, setLoadingVisits] = useState(false);

    // Digital Receipt Modal State
    const [receiptData, setReceiptData] = useState(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    // Load live summary, route plan, and visits
    useEffect(() => {
        apiFetch('/api/v1/collection/collector-summary')
            .then((res) => {
                if (res?.data) setSummary(res.data);
            })
            .catch((err) => console.warn('Collector summary fetch notice:', err.message));

        loadRoutePlan();
        loadVisits();
    }, [gpsLocation.lat, gpsLocation.lng]);

    const loadRoutePlan = async () => {
        setLoadingRoute(true);
        try {
            const res = await apiFetch(`/api/v1/collection/route-plan?lat=${gpsLocation.lat}&lng=${gpsLocation.lng}&limit=6`);
            if (res?.data) setRoutePlan(res.data);
        } catch (err) {
            console.warn('Route plan fetch notice:', err.message);
        } finally {
            setLoadingRoute(false);
        }
    };

    const loadVisits = async () => {
        setLoadingVisits(true);
        try {
            const res = await apiFetch('/api/v1/visits?today=true');
            if (res?.data) setVisits(res.data);
        } catch (err) {
            console.warn('Visits fetch notice:', err.message);
        } finally {
            setLoadingVisits(false);
        }
    };

    const handleCompleteVisit = async (visitId) => {
        try {
            await apiFetch(`/api/v1/visits/${visitId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'COMPLETED' }),
            });
            setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, status: 'COMPLETED' } : v)));
        } catch (err) {
            alert('Failed to update visit: ' + err.message);
        }
    };

    // -------------------------------------------------------------
    // Tab 1: Quick Form Input State
    // -------------------------------------------------------------
    const [formDonorName, setFormDonorName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formMode, setFormMode] = useState('CASH');
    const [formStatus, setFormStatus] = useState('PAID');
    const [formAddress, setFormAddress] = useState('Ballygunge Ward 85, Kolkata');
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formSuccess, setFormSuccess] = useState(null);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formDonorName || !formAmount) return;

        setFormSubmitting(true);
        try {
            await apiFetch('/api/v1/collection/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    donor_name: formDonorName,
                    amount: parseFloat(formAmount),
                    promised_amount: parseFloat(formAmount),
                    payment_mode: formMode,
                    payment_status: formStatus,
                    physical_address_raw: formAddress,
                    gps_lat: gpsLocation.lat,
                    gps_lng: gpsLocation.lng,
                    campaign_id: selectedCampaign.id,
                }),
            });

            const generatedReceipt = `DP26-${Math.floor(100000 + Math.random() * 900000)}`;
            setReceiptData({
                receipt_number: generatedReceipt,
                donor_name: formDonorName,
                donor_phone: '',
                amount: parseFloat(formAmount),
                payment_mode: formMode,
                payment_status: formStatus,
            });
            setIsReceiptOpen(true);

            setFormSuccess(`Recorded ${formatIndianCurrency(formAmount)} from ${formDonorName} (${formStatus})`);
            setFormDonorName('');
            setFormAmount('');

            // Update stats optimistically
            setSummary((prev) => ({
                ...prev,
                collected_today: prev.collected_today + (formStatus !== 'PENDING' ? parseFloat(formAmount) : 0),
                cash_in_hand: prev.cash_in_hand + (formMode === 'CASH' && formStatus !== 'PENDING' ? parseFloat(formAmount) : 0),
            }));

            setTimeout(() => setFormSuccess(null), 5000);
        } catch (err) {
            alert('Error recording collection: ' + err.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    // -------------------------------------------------------------
    // Tab 2: Quick Chat Parsing State & Confirmation Interceptor
    // -------------------------------------------------------------
    const [chatInput, setChatInput] = useState('');
    const [parsingChat, setParsingChat] = useState(false);
    const [tentativeEntry, setTentativeEntry] = useState(null);
    const [interceptorOpen, setInterceptorOpen] = useState(false);
    const [confirmSubmitting, setConfirmSubmitting] = useState(false);

    const sampleChips = [
        'Anindita Roy 500 cash',
        'Rahul Sharma paid 12000 through UPI',
        'Amit Ghosh payment pending',
        'Sneha Mukherjee 2500 partial paid cash',
    ];

    const handleParseChat = async (textToParse) => {
        const text = textToParse || chatInput;
        if (!text.trim()) return;

        setParsingChat(true);
        try {
            const res = await apiFetch('/api/v1/collection/parse-chat', {
                method: 'POST',
                body: JSON.stringify({ text }),
            });

            if (res.parsed) {
                setTentativeEntry(res.parsed);
                // Open confirmation interceptor modal (strictly requires explicit user confirmation)
                setInterceptorOpen(true);
            }
        } catch (err) {
            alert('Parser Error: ' + err.message);
        } finally {
            setParsingChat(false);
        }
    };

    const handleConfirmTentative = async () => {
        if (!tentativeEntry) return;
        setConfirmSubmitting(true);
        try {
            await apiFetch('/api/v1/collection/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    donor_name: tentativeEntry.donor_name,
                    amount: tentativeEntry.amount,
                    promised_amount: tentativeEntry.amount,
                    payment_mode: tentativeEntry.payment_mode || 'CASH',
                    payment_status: tentativeEntry.payment_status || 'PAID',
                    physical_address_raw: `${formAddress} (via Chat Parser)`,
                    gps_lat: gpsLocation.lat,
                    gps_lng: gpsLocation.lng,
                    campaign_id: selectedCampaign.id,
                }),
            });

            const generatedReceipt = `DP26-${Math.floor(100000 + Math.random() * 900000)}`;
            setReceiptData({
                receipt_number: generatedReceipt,
                donor_name: tentativeEntry.donor_name,
                donor_phone: '',
                amount: tentativeEntry.amount,
                payment_mode: tentativeEntry.payment_mode || 'CASH',
                payment_status: tentativeEntry.payment_status || 'PAID',
            });
            setIsReceiptOpen(true);

            setFormSuccess(`Confirmed: ${tentativeEntry.donor_name} — ${formatIndianCurrency(tentativeEntry.amount)} (${tentativeEntry.payment_mode || 'None'})`);
            setInterceptorOpen(false);
            setChatInput('');
            setTentativeEntry(null);

            // Update stats
            setSummary((prev) => ({
                ...prev,
                collected_today: prev.collected_today + (tentativeEntry.payment_status !== 'PENDING' ? tentativeEntry.amount : 0),
                cash_in_hand: prev.cash_in_hand + (tentativeEntry.payment_mode === 'CASH' && tentativeEntry.payment_status !== 'PENDING' ? tentativeEntry.amount : 0),
                upi_settlements: {
                    count: prev.upi_settlements.count + (tentativeEntry.payment_mode === 'UPI' ? 1 : 0),
                    total: prev.upi_settlements.total + (tentativeEntry.payment_mode === 'UPI' ? tentativeEntry.amount : 0),
                },
            }));

            setTimeout(() => setFormSuccess(null), 5000);
        } catch (err) {
            alert('Confirmation error: ' + err.message);
        } finally {
            setConfirmSubmitting(false);
        }
    };

    const handleEditTentative = () => {
        if (!tentativeEntry) return;
        setFormDonorName(tentativeEntry.donor_name);
        setFormAmount(tentativeEntry.amount ? tentativeEntry.amount.toString() : '');
        setFormMode(tentativeEntry.payment_mode || 'CASH');
        setFormStatus(tentativeEntry.payment_status || 'PAID');
        setInterceptorOpen(false);
        setActiveTab('form');
    };

    // -------------------------------------------------------------
    // Tab 3: Priority Routing Map State
    // -------------------------------------------------------------
    const [mapTargets, setMapTargets] = useState([]);
    const [nextStopData, setNextStopData] = useState(null);
    const [mapLoading, setMapLoading] = useState(false);

    const loadPriorityMap = () => {
        setMapLoading(true);
        apiFetch(`/api/v1/collector/priority-map?lat=${gpsLocation.lat}&lng=${gpsLocation.lng}&search_radius=10`)
            .then((res) => {
                if (res.groupings?.all_targets) {
                    setMapTargets(res.groupings.all_targets);
                }
                if (res.next_stop) {
                    setNextStopData(res.next_stop);
                }
            })
            .catch((err) => console.warn('Priority map fetch notice:', err.message))
            .finally(() => setMapLoading(false));
    };

    useEffect(() => {
        if (activeTab === 'map') {
            loadPriorityMap();
        }
    }, [activeTab]);

    return (
        <div className="collector-pwa-container" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '32px' }}>
            <OfflineIndicator />
            {/* Header: Greeting + Dynamic Event Switcher */}
            <div
                className="collector-header"
                style={{
                    backgroundColor: '#FFFFFF',
                    borderBottom: '2px solid #1B5E20',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                }}
            >
                <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E65100', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Field Operations Desk
                    </span>
                    <h1 style={{ margin: '2px 0 0', fontSize: '1.375rem', fontWeight: 800, color: '#1B5E20' }}>
                        {greeting}, {collectorName}
                    </h1>
                </div>

                {/* Event Switcher Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#1B5E20" />
                    <select
                        value={selectedCampaign.id}
                        onChange={(e) => {
                            const found = FESTIVAL_CAMPAIGNS.find((c) => c.id === e.target.value);
                            if (found) setSelectedCampaign(found);
                        }}
                        style={{
                            padding: '8px 12px',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: '#1B5E20',
                            backgroundColor: '#F9F9FB',
                            border: '1px solid #1B5E20',
                            borderRadius: '6px',
                            cursor: 'pointer',
                        }}
                    >
                        {FESTIVAL_CAMPAIGNS.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Success Alert Banner */}
            {formSuccess && (
                <div
                    style={{
                        backgroundColor: '#E8F5E9',
                        color: '#1B5E20',
                        border: '1px solid #2E7D32',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                    }}
                >
                    <CheckCircle size={18} color="#2E7D32" />
                    <span>{formSuccess}</span>
                </div>
            )}

            {/* Four-Box Numerical Summary Block (Indian Enterprise Graphics Style) */}
            <div
                className="summary-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px',
                }}
            >
                {/* 1. Collected Today */}
                <div
                    className="metric-box"
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #1B5E20', // Forest Green
                        padding: '14px 16px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>COLLECTED TODAY</span>
                        <IndianRupee size={16} color="#1B5E20" />
                    </div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#1B5E20', marginTop: '6px' }}>
                        {formatIndianCurrency(summary.collected_today)}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#2E7D32', fontWeight: 600, marginTop: '2px' }}>
                        ● Active shift collections
                    </div>
                </div>

                {/* 2. Target Progress (Restrained Saffron Highlight Line) */}
                <div
                    className="metric-box"
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #E65100', // Saffron Accent Line
                        padding: '14px 16px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>TARGET PROGRESS</span>
                        <TrendingUp size={16} color="#E65100" />
                    </div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#E65100', marginTop: '6px' }}>
                        {formatIndianCompact(summary.target_progress?.current || 542500)} / {formatIndianCompact(selectedCampaign.target)}
                    </div>
                    {/* Saffron Highlight Progress Bar */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#FFE0B2', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${Math.min(100, summary.target_progress?.percent || 78)}%`,
                                height: '100%',
                                backgroundColor: '#E65100',
                            }}
                        />
                    </div>
                </div>

                {/* 3. Cash In Hand Balance */}
                <div
                    className="metric-box"
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #2E7D32',
                        padding: '14px 16px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>CASH IN HAND</span>
                        <Wallet size={16} color="#2E7D32" />
                    </div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#2E7D32', marginTop: '6px' }}>
                        {formatIndianCurrency(summary.cash_in_hand)}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#616161', marginTop: '2px' }}>
                        Requires cashier handover
                    </div>
                </div>

                {/* 4. UPI Settlements Completed */}
                <div
                    className="metric-box"
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #1565C0',
                        padding: '14px 16px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#616161' }}>UPI COMPLETED</span>
                        <QrCode size={16} color="#1565C0" />
                    </div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#1565C0', marginTop: '6px' }}>
                        {summary.upi_settlements?.count || 14} <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>({formatIndianCurrency(summary.upi_settlements?.total || 6100)})</span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#2E7D32', fontWeight: 600, marginTop: '2px' }}>
                        Direct bank account credit
                    </div>
                </div>
            </div>

            {/* Functional Primary Tabs — Large Touch Targets for Android */}
            <div
                className="collector-tabs"
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
                    onClick={() => setActiveTab('form')}
                    style={{
                        flex: 1,
                        padding: '12px 10px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'form' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'form' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'form' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Edit3 size={15} />
                    <span>Quick Entry</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    style={{
                        flex: 1,
                        padding: '12px 10px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'chat' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'chat' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'chat' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Sparkles size={15} color={activeTab === 'chat' ? '#E65100' : '#757575'} />
                    <span>Chat Parser</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('route')}
                    style={{
                        flex: 1,
                        padding: '12px 10px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'route' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'route' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'route' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Route size={15} />
                    <span>Plan Route</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('visits')}
                    style={{
                        flex: 1,
                        padding: '12px 10px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'visits' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'visits' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'visits' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <CalendarDays size={15} />
                    <span>Visits ({visits.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    style={{
                        flex: 1,
                        padding: '12px 10px',
                        minHeight: '48px',
                        border: 'none',
                        borderBottom: activeTab === 'map' ? '4px solid #1B5E20' : '4px solid transparent',
                        backgroundColor: activeTab === 'map' ? '#F9F9FB' : '#FFFFFF',
                        color: activeTab === 'map' ? '#1B5E20' : '#616161',
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Navigation size={15} />
                    <span>Map</span>
                </button>
            </div>

            {/* Tab 1 Content: Quick Form Input */}
            {activeTab === 'form' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        padding: '20px',
                        borderRadius: '0 0 8px 8px',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                            {/* Donor Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#212121', marginBottom: '6px' }}>
                                    Donor Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Subhashis Paul"
                                    value={formDonorName}
                                    onChange={(e) => setFormDonorName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        minHeight: '48px', // Large touch target
                                        padding: '10px 14px',
                                        fontSize: '0.9375rem',
                                        border: '1px solid #BDBDBD',
                                        borderRadius: '6px',
                                        backgroundColor: '#F9F9FB',
                                    }}
                                />
                            </div>

                            {/* Collection Amount */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#212121', marginBottom: '6px' }}>
                                    Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1"
                                    placeholder="e.g. 1500"
                                    value={formAmount}
                                    onChange={(e) => setFormAmount(e.target.value)}
                                    style={{
                                        width: '100%',
                                        minHeight: '48px',
                                        padding: '10px 14px',
                                        fontSize: '0.9375rem',
                                        fontWeight: 700,
                                        border: '1px solid #BDBDBD',
                                        borderRadius: '6px',
                                        backgroundColor: '#F9F9FB',
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                            {/* Payment Method */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#212121', marginBottom: '6px' }}>
                                    Payment Method *
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    {['CASH', 'UPI', 'BANK_TRANSFER'].map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setFormMode(mode)}
                                            style={{
                                                minHeight: '48px',
                                                border: formMode === mode ? '2px solid #1B5E20' : '1px solid #E0E0E0',
                                                backgroundColor: formMode === mode ? '#E8F5E9' : '#FFFFFF',
                                                color: formMode === mode ? '#1B5E20' : '#424242',
                                                fontWeight: 700,
                                                fontSize: '0.8125rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {mode === 'BANK_TRANSFER' ? 'BANK' : mode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#212121', marginBottom: '6px' }}>
                                    Collection Status *
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    {[
                                        { val: 'PAID', label: 'Paid', color: '#2E7D32', bg: '#E8F5E9' },
                                        { val: 'PARTIAL', label: 'Partial', color: '#F9A825', bg: '#FFF9C4' },
                                        { val: 'PENDING', label: 'Pending', color: '#C62828', bg: '#FFEBEE' },
                                    ].map((st) => (
                                        <button
                                            key={st.val}
                                            type="button"
                                            onClick={() => setFormStatus(st.val)}
                                            style={{
                                                minHeight: '48px',
                                                border: formStatus === st.val ? `2px solid ${st.color}` : '1px solid #E0E0E0',
                                                backgroundColor: formStatus === st.val ? st.bg : '#FFFFFF',
                                                color: formStatus === st.val ? st.color : '#424242',
                                                fontWeight: 800,
                                                fontSize: '0.8125rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {st.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Physical Address / Landmark */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#212121', marginBottom: '6px' }}>
                                Physical Neighborhood Address
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 14/2 Broad Street, Ballygunge"
                                value={formAddress}
                                onChange={(e) => setFormAddress(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '44px',
                                    padding: '8px 14px',
                                    fontSize: '0.875rem',
                                    border: '1px solid #BDBDBD',
                                    borderRadius: '6px',
                                    backgroundColor: '#F9F9FB',
                                }}
                            />
                        </div>

                        {/* Map Preview Block: Location captured via browser GPS */}
                        <div
                            style={{
                                backgroundColor: '#F1F8E9',
                                border: '1px solid #C8E6C9',
                                borderRadius: '6px',
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <MapPin size={18} color="#1B5E20" />
                            <div style={{ fontSize: '0.8125rem', color: '#1B5E20', fontWeight: 600 }}>
                                Location captured via browser GPS: {gpsLocation.lat.toFixed(4)}° N, {gpsLocation.lng.toFixed(4)}° E
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={formSubmitting}
                            style={{
                                minHeight: '50px',
                                backgroundColor: '#1B5E20',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 4px rgba(27, 94, 32, 0.3)',
                            }}
                        >
                            <CheckCircle size={18} />
                            <span>{formSubmitting ? 'Recording Entry...' : 'Record Collection Entry'}</span>
                        </button>
                    </form>
                </div>
            )}

            {/* Tab 2 Content: Quick Chat Parsing Mode */}
            {activeTab === 'chat' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        padding: '20px',
                        borderRadius: '0 0 8px 8px',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#1B5E20' }}>
                            Conversational Receipt Parser
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#616161' }}>
                            Type or paste raw field speech/text. The parser extracts the Indian name, amount, and payment mode without third-party LLM costs.
                        </p>
                    </div>

                    {/* Quick Test Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#757575', alignSelf: 'center' }}>Try sample:</span>
                        {sampleChips.map((chip, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => {
                                    setChatInput(chip);
                                    handleParseChat(chip);
                                }}
                                style={{
                                    backgroundColor: '#F5F5F5',
                                    border: '1px solid #E0E0E0',
                                    borderRadius: '16px',
                                    padding: '4px 10px',
                                    fontSize: '0.75rem',
                                    color: '#212121',
                                    cursor: 'pointer',
                                }}
                            >
                                "{chip}"
                            </button>
                        ))}
                    </div>

                    {/* Chat Text Input Container */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder="e.g. Anindita Roy 500 cash or Rahul Sharma paid 12000 through UPI"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleParseChat();
                            }}
                            style={{
                                flex: 1,
                                minHeight: '50px',
                                padding: '12px 16px',
                                fontSize: '0.9375rem',
                                border: '2px solid #1B5E20',
                                borderRadius: '6px',
                                backgroundColor: '#FAFAFA',
                            }}
                        />
                        <button
                            type="button"
                            disabled={parsingChat || !chatInput.trim()}
                            onClick={() => handleParseChat()}
                            style={{
                                padding: '0 20px',
                                minHeight: '50px',
                                backgroundColor: '#1B5E20',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <Send size={16} />
                            <span>{parsingChat ? 'Parsing...' : 'Parse'}</span>
                        </button>
                    </div>

                    <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#757575', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} color="#1B5E20" />
                        <span>Database Safety Guarantee: Direct database commits are strictly blocked until confirmed below.</span>
                    </div>
                </div>
            )}

            {/* Tab 3 Content: Field Priority Map Canvas */}
            {activeTab === 'map' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        padding: '20px',
                        borderRadius: '0 0 8px 8px',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                    }}
                >
                    <CollectorMap
                        collectorLocation={gpsLocation}
                        targets={mapTargets}
                        nextStop={nextStopData}
                        onRefresh={loadPriorityMap}
                        loading={mapLoading}
                    />
                </div>
            )}

            {/* Tab 4 Content: Smart Route Planning */}
            {activeTab === 'route' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        padding: '20px',
                        borderRadius: '0 0 8px 8px',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1B5E20' }}>
                                Today's Optimized Route Plan
                            </h3>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#616161' }}>
                                Nearest-neighbor sequence prioritizing high pending amounts near your GPS location.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={loadRoutePlan}
                            disabled={loadingRoute}
                            style={{
                                padding: '8px 14px',
                                minHeight: '38px',
                                backgroundColor: '#E8F5E9',
                                border: '1px solid #1B5E20',
                                borderRadius: '6px',
                                color: '#1B5E20',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                            }}
                        >
                            {loadingRoute ? 'Optimizing...' : '↻ Recalculate Route'}
                        </button>
                    </div>

                    {/* Route Metric Summary */}
                    {routePlan && (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '10px',
                                padding: '12px',
                                backgroundColor: '#F9F9FB',
                                border: '1px solid #E0E0E0',
                                borderRadius: '8px',
                                marginBottom: '20px',
                            }}
                        >
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#616161' }}>Total Stops:</span>
                                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#212121' }}>
                                    {routePlan.stops_count || 4} Stops
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#616161' }}>Total Distance:</span>
                                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#212121' }}>
                                    ~{routePlan.total_distance_km || '1.8'} km
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#616161' }}>Estimated Time:</span>
                                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#212121' }}>
                                    ~{routePlan.estimated_time_minutes || '55'} mins
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#616161' }}>Expected Collection:</span>
                                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1B5E20' }}>
                                    {formatIndianCurrency(routePlan.total_expected_amount || 9000)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ordered Route Stops */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(routePlan?.stops || []).map((stop, index) => (
                            <div
                                key={stop.house_id || index}
                                style={{
                                    border: '1px solid #E0E0E0',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    backgroundColor: index === 0 ? '#F1F8E9' : '#FFFFFF',
                                    borderLeft: `5px solid ${index === 0 ? '#1B5E20' : '#E0E0E0'}`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: index === 0 ? '#1B5E20' : '#616161',
                                                color: '#FFFFFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#212121' }}>
                                                {stop.donor_name}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: '#616161', marginTop: '2px' }}>
                                                {stop.address}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1B5E20' }}>
                                            {formatIndianCurrency(stop.pending_amount || stop.expected_amount)}
                                        </div>
                                        {stop.ai_predicted_target && (
                                            <div style={{ fontSize: '0.75rem', color: '#6D28D9', fontWeight: 700 }}>
                                                🤖 AI Target: {formatIndianCurrency(stop.ai_predicted_target)}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.75rem', color: '#757575' }}>
                                            ~{stop.distance_from_previous_meters ? `${stop.distance_from_previous_meters}m away` : 'Next in sector'}
                                        </div>
                                    </div>
                                </div>

                                {/* Stop Actions */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                    <a
                                        href={stop.nav_url || `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            flex: 1,
                                            minHeight: '44px',
                                            backgroundColor: '#1B5E20',
                                            color: '#FFFFFF',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <Navigation size={16} /> Navigate
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormDonorName(stop.donor_name);
                                            setFormAmount(String(stop.ai_predicted_target || stop.pending_amount || stop.expected_amount || 1000));
                                            setFormAddress(stop.address);
                                            setActiveTab('form');
                                        }}
                                        style={{
                                            flex: 1,
                                            minHeight: '44px',
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #1B5E20',
                                            color: '#1B5E20',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Record Collection
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 5 Content: Scheduled Donor Appointments / Visits */}
            {activeTab === 'visits' && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        padding: '20px',
                        borderRadius: '0 0 8px 8px',
                        border: '1px solid #E0E0E0',
                        borderTop: 'none',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1B5E20' }}>
                                Today's Scheduled Visits
                            </h3>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#616161' }}>
                                Appointments scheduled for today's collection rounds.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={loadVisits}
                            disabled={loadingVisits}
                            style={{
                                padding: '6px 12px',
                                minHeight: '36px',
                                backgroundColor: '#F9F9FB',
                                border: '1px solid #E0E0E0',
                                borderRadius: '6px',
                                color: '#616161',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                            }}
                        >
                            {loadingVisits ? 'Refreshing...' : '↻ Refresh'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {visits.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#757575' }}>
                                <CalendarDays size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                                <p style={{ margin: 0, fontWeight: 600 }}>No visits scheduled for today.</p>
                                <span style={{ fontSize: '0.8125rem' }}>Schedule follow-ups when donors request a later time.</span>
                            </div>
                        ) : (
                            visits.map((v) => (
                                <div
                                    key={v.id}
                                    style={{
                                        border: '1px solid #E0E0E0',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        backgroundColor: v.status === 'COMPLETED' ? '#F5F5F5' : '#FFFFFF',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#212121' }}>
                                                {v.donor?.full_name || 'Household Representative'}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: '#616161', marginTop: '2px' }}>
                                                ⏰ Scheduled: {new Date(v.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {v.house?.address_line && (
                                                <div style={{ fontSize: '0.8125rem', color: '#757575', marginTop: '2px' }}>
                                                    🏠 {v.house.address_line}
                                                </div>
                                            )}
                                            {v.notes && (
                                                <div style={{ fontSize: '0.8125rem', color: '#E65100', marginTop: '4px', fontStyle: 'italic' }}>
                                                    Note: {v.notes}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <span
                                                style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    backgroundColor: v.status === 'COMPLETED' ? '#E8F5E9' : '#FFF9C4',
                                                    color: v.status === 'COMPLETED' ? '#2E7D32' : '#F57F17',
                                                }}
                                            >
                                                {v.status}
                                            </span>
                                        </div>
                                    </div>

                                    {v.status !== 'COMPLETED' && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormDonorName(v.donor?.full_name || '');
                                                    setFormAddress(v.house?.address_line || formAddress);
                                                    setActiveTab('form');
                                                }}
                                                style={{
                                                    flex: 1,
                                                    minHeight: '40px',
                                                    backgroundColor: '#1B5E20',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Record Collection
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleCompleteVisit(v.id)}
                                                style={{
                                                    minHeight: '40px',
                                                    padding: '0 16px',
                                                    backgroundColor: '#FFFFFF',
                                                    border: '1px solid #BDBDBD',
                                                    borderRadius: '6px',
                                                    color: '#424242',
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Mark Done
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* High-Contrast Confirmation Interceptor Modal */}
            {interceptorOpen && tentativeEntry && (
                <div
                    className="confirmation-interceptor-overlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '16px',
                    }}
                >
                    <div
                        className="confirmation-interceptor-modal"
                        style={{
                            backgroundColor: '#FFFFFF',
                            width: '100%',
                            maxWidth: '480px',
                            borderRadius: '8px',
                            border: '3px solid #1B5E20',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Modal Header */}
                        <div
                            style={{
                                backgroundColor: '#1B5E20',
                                color: '#FFFFFF',
                                padding: '14px 18px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={20} color="#FFF" />
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                                    Confirm Collection Entry
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInterceptorOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px' }}>
                            <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: '#616161' }}>
                                Parsed from: <em>"{tentativeEntry.raw_text}"</em>
                            </p>

                            <div
                                style={{
                                    backgroundColor: '#F9F9FB',
                                    border: '1px solid #E0E0E0',
                                    borderRadius: '6px',
                                    padding: '14px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8125rem', color: '#616161' }}>Donor Name:</span>
                                    <strong style={{ fontSize: '0.9375rem', color: '#212121' }}>{tentativeEntry.donor_name}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8125rem', color: '#616161' }}>Amount:</span>
                                    <strong style={{ fontSize: '1.125rem', color: '#1B5E20', fontWeight: 800 }}>
                                        {formatIndianCurrency(tentativeEntry.amount)}
                                    </strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8125rem', color: '#616161' }}>Payment Mode:</span>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            fontSize: '0.8125rem',
                                            backgroundColor: '#E8F5E9',
                                            color: '#1B5E20',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {tentativeEntry.payment_mode || 'None / Pending'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8125rem', color: '#616161' }}>Status:</span>
                                    <span
                                        style={{
                                            fontWeight: 800,
                                            fontSize: '0.8125rem',
                                            backgroundColor: tentativeEntry.payment_status === 'PAID' ? '#E8F5E9' : '#FFF9C4',
                                            color: tentativeEntry.payment_status === 'PAID' ? '#2E7D32' : '#F9A825',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {tentativeEntry.payment_status}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={handleEditTentative}
                                    style={{
                                        flex: 1,
                                        minHeight: '48px',
                                        backgroundColor: '#FFFFFF',
                                        color: '#424242',
                                        border: '1px solid #9E9E9E',
                                        borderRadius: '6px',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    disabled={confirmSubmitting}
                                    onClick={handleConfirmTentative}
                                    style={{
                                        flex: 2,
                                        minHeight: '48px',
                                        backgroundColor: '#1B5E20',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 800,
                                        fontSize: '0.9375rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <CheckCircle size={18} />
                                    <span>{confirmSubmitting ? 'Committing...' : 'Confirm Collection'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Instant Digital Receipt Modal */}
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                receipt={receiptData}
            />
        </div>
    );
}
