import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Phone, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatIndianCurrency } from '../utils/indianNumberFormat';
import ReminderTrigger from './ReminderTrigger';

// Fix Leaflet's default icon path issues in bundled environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker generator using SVG DivIcons for crisp, high-contrast Indian enterprise look
function createCustomPin(color, label = '', isCollector = false) {
    if (isCollector) {
        return L.divIcon({
            className: 'collector-gps-pin',
            html: `
                <div style="
                    width: 22px; height: 22px;
                    background: #1B5E20;
                    border: 3px solid #FFFFFF;
                    border-radius: 50%;
                    box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.4), 0 3px 8px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
        });
    }

    return L.divIcon({
        className: 'custom-donor-pin',
        html: `
            <div style="
                background: ${color};
                color: #FFFFFF;
                width: 28px;
                height: 28px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #FFFFFF;
                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            ">
                <span style="
                    transform: rotate(45deg);
                    font-size: 11px;
                    font-weight: 700;
                    font-family: sans-serif;
                ">${label}</span>
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    });
}

const STATUS_CONFIG = {
    PAID: { color: '#2E7D32', label: '✓', bg: '#E8F5E9', border: '#2E7D32', text: '#1B5E20' },
    PARTIAL: { color: '#F9A825', label: '½', bg: '#FFF9C4', border: '#F9A825', text: '#E65100' },
    PENDING: { color: '#C62828', label: '!', bg: '#FFEBEE', border: '#C62828', text: '#B71C1C' },
};

export default function CollectorMap({
    collectorLocation = { lat: 22.535, lng: 88.365 },
    targets = [],
    nextStop = null,
    onRefresh,
    loading = false,
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const [selectedTarget, setSelectedTarget] = useState(null);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [collectorLocation.lat, collectorLocation.lng],
            zoom: 13,
            zoomControl: true,
            attributionControl: true,
        });

        // Localized OpenStreetMap standard tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors | CollectiQ Field Routing',
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Update markers when targets or collector location change
    useEffect(() => {
        const map = mapInstanceRef.current;
        const markersLayer = markersLayerRef.current;
        if (!map || !markersLayer) return;

        markersLayer.clearLayers();

        // 1. Collector current location marker
        const collectorMarker = L.marker([collectorLocation.lat, collectorLocation.lng], {
            icon: createCustomPin('#1B5E20', '', true),
            title: 'Your Current Field Location',
        }).bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
                <strong style="color: #1B5E20; font-size: 13px;">📍 Your Location (GPS)</strong>
                <p style="margin: 4px 0 0; font-size: 11px; color: #555;">Live coordinates: ${collectorLocation.lat.toFixed(4)}, ${collectorLocation.lng.toFixed(4)}</p>
            </div>
        `);
        markersLayer.addLayer(collectorMarker);

        const bounds = L.latLngBounds([[collectorLocation.lat, collectorLocation.lng]]);

        // 2. Add target donor markers
        targets.forEach((t, idx) => {
            if (!t.lat || !t.lng) return;

            const st = STATUS_CONFIG[t.payment_status] || STATUS_CONFIG.PENDING;
            const marker = L.marker([t.lat, t.lng], {
                icon: createCustomPin(st.color, idx + 1),
                title: `${t.donor_name} — ${t.address}`,
            });

            const popupContent = `
                <div style="font-family: sans-serif; min-width: 190px; padding: 2px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-weight: 700; font-size: 13px; color: #212121;">${t.donor_name}</span>
                        <span style="background: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border}; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px;">
                            ${t.payment_status}
                        </span>
                    </div>
                    <div style="font-size: 12px; color: #424242; margin-bottom: 4px;">
                        📍 ${t.address}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
                        <span>Pending: <strong style="color: #C62828;">${formatIndianCurrency(t.pending_amount)}</strong></span>
                        <span>Distance: <strong>${t.distance_km} km</strong></span>
                    </div>
                    <a href="${t.navigation_url || `https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}`}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       style="display: block; text-align: center; background: #1B5E20; color: #fff; text-decoration: none; padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                       🧭 Start Navigation
                    </a>
                </div>
            `;

            marker.bindPopup(popupContent);
            marker.on('click', () => setSelectedTarget(t));
            markersLayer.addLayer(marker);
            bounds.extend([t.lat, t.lng]);
        });

        if (targets.length > 0) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
    }, [targets, collectorLocation]);

    const activeNextStop = nextStop || targets.find((t) => t.payment_status !== 'PAID');

    return (
        <div className="collector-map-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Operational Action Container for Next Planned Collection Stop */}
            {activeNextStop && (
                <div
                    className="next-stop-banner"
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #1B5E20',
                        borderLeft: '8px solid #E65100', // Saffron highlight line
                        borderRadius: '8px',
                        padding: '14px 18px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <div style={{ flex: '1 1 280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span
                                style={{
                                    backgroundColor: '#E65100',
                                    color: '#FFFFFF',
                                    fontSize: '0.6875rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.5px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Priority Dispatch
                            </span>
                            <span style={{ fontSize: '0.8125rem', color: '#616161' }}>
                                Score: {activeNextStop.priority_score ? (activeNextStop.priority_score * 100).toFixed(0) : '95'}/100
                            </span>
                        </div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '1.0625rem', fontWeight: 800, color: '#1B5E20' }}>
                            Next Stop: {activeNextStop.donor_name} • {activeNextStop.distance_km} km away • {formatIndianCurrency(activeNextStop.pending_amount)} Pending
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#424242' }}>
                            📍 {activeNextStop.address} ({activeNextStop.locality || activeNextStop.zone})
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <ReminderTrigger
                            donorName={activeNextStop.donor_name}
                            balanceAmount={activeNextStop.pending_amount}
                            mobile={activeNextStop.phone}
                            compact={false}
                        />
                        <a
                            href={activeNextStop.navigation_url || `https://www.google.com/maps/dir/?api=1&destination=${activeNextStop.lat},${activeNextStop.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: '#1B5E20',
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                borderRadius: '6px',
                                boxShadow: '0 2px 4px rgba(27, 94, 32, 0.3)',
                            }}
                        >
                            <Navigation size={16} />
                            <span>Start Navigation</span>
                        </a>
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div
                style={{
                    position: 'relative',
                    height: '360px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #E0E0E0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
            >
                <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

                {/* Map Control Bar Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        zIndex: 1000,
                        backgroundColor: '#FFFFFF',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2E7D32' }}></span>
                        <span>Paid</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F9A825' }}></span>
                        <span>Partial</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#C62828' }}></span>
                        <span>Pending</span>
                    </div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#1B5E20',
                                padding: '2px 4px',
                            }}
                            title="Refresh GPS and Targets"
                        >
                            <RefreshCw size={13} className={loading ? 'spin' : ''} />
                        </button>
                    )}
                </div>
            </div>

            {/* Recommended Follow-ups Table beneath map */}
            <div
                className="recommended-followups-card"
                style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                <div
                    style={{
                        padding: '12px 16px',
                        backgroundColor: '#F9F9FB',
                        borderBottom: '1px solid #E0E0E0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#1B5E20' }}>
                            Recommended Follow-ups
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#616161' }}>
                            Ranked by linear priority score: 60% pending balance weight + 40% proximity factor
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#E8F5E9',
                            color: '#1B5E20',
                            padding: '3px 8px',
                            borderRadius: '4px',
                        }}
                    >
                        {targets.length} Assigned Checkpoints
                    </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '1px solid #E0E0E0', textAlign: 'left' }}>
                                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#424242' }}>Seq</th>
                                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#424242' }}>Donor / Address</th>
                                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#424242' }}>Status</th>
                                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#424242', textAlign: 'right' }}>Pending</th>
                                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#424242' }}>Distance</th>
                                <th style={{ padding: '8px 12px', fontWeight: 700, color: '#424242', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {targets.map((t, idx) => {
                                const st = STATUS_CONFIG[t.payment_status] || STATUS_CONFIG.PENDING;
                                const isNext = activeNextStop && activeNextStop.id === t.id;
                                return (
                                    <tr
                                        key={t.id || idx}
                                        style={{
                                            borderBottom: '1px solid #EEEEEE',
                                            backgroundColor: isNext ? '#F1F8E9' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                                        }}
                                    >
                                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1B5E20' }}>
                                            #{idx + 1}
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <div style={{ fontWeight: 700, color: '#212121' }}>{t.donor_name}</div>
                                            <div style={{ fontSize: '0.6875rem', color: '#616161' }}>{t.address}</div>
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    backgroundColor: st.bg,
                                                    color: st.text,
                                                    border: `1px solid ${st.border}`,
                                                }}
                                            >
                                                {t.payment_status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: t.pending_amount > 0 ? '#C62828' : '#2E7D32' }}>
                                            {formatIndianCurrency(t.pending_amount)}
                                        </td>
                                        <td style={{ padding: '8px 12px', color: '#424242' }}>
                                            {t.distance_km} km
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                {t.pending_amount > 0 && (
                                                    <ReminderTrigger
                                                        donorName={t.donor_name}
                                                        balanceAmount={t.pending_amount}
                                                        mobile={t.phone}
                                                        compact={true}
                                                    />
                                                )}
                                                <a
                                                    href={t.navigation_url || `https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Start Navigation in Google Maps"
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: '#1B5E20',
                                                        color: '#fff',
                                                        borderRadius: '4px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        textDecoration: 'none',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    <Navigation size={12} style={{ marginRight: '3px' }} />
                                                    Nav
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
