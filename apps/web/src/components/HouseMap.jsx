import { useState, useCallback } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    Pin,
    InfoWindow,
    useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { CheckCircle, Clock, MapPin, Phone, Home } from 'lucide-react';

// Zone color palette matching the app's saffron-gold design
const ZONE_COLORS = {
    'Zone A': { bg: '#E8652B', border: '#C44E1A', glyph: '#fff' },
    'Zone B': { bg: '#3B82F6', border: '#2563EB', glyph: '#fff' },
    'Zone C': { bg: '#10B981', border: '#059669', glyph: '#fff' },
    'Zone D': { bg: '#8B5CF6', border: '#7C3AED', glyph: '#fff' },
};

const KOLKATA_CENTER = { lat: 22.5726, lng: 88.3639 };

function HouseMarker({ house, isSelected, onSelect }) {
    const [markerRef, marker] = useAdvancedMarkerRef();
    const colors = ZONE_COLORS[house.zone] || ZONE_COLORS['Zone A'];

    return (
        <>
            <AdvancedMarker
                ref={markerRef}
                position={{ lat: house.lat, lng: house.lng }}
                title={`${house.address} — ${house.donor}`}
                onClick={() => onSelect(house, marker)}
            >
                <Pin
                    background={house.collected ? '#22c55e' : colors.bg}
                    borderColor={house.collected ? '#16a34a' : colors.border}
                    glyphColor={colors.glyph}
                    scale={isSelected ? 1.3 : 1.0}
                >
                    {house.collected ? (
                        <CheckCircle size={14} color="#fff" />
                    ) : (
                        <Home size={14} color="#fff" />
                    )}
                </Pin>
            </AdvancedMarker>

            {isSelected && marker && (
                <InfoWindow
                    anchor={marker}
                    onCloseClick={() => onSelect(null, null)}
                    headerDisabled
                >
                    <div style={{ padding: '4px 2px', minWidth: '180px', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <span style={{
                                display: 'inline-block',
                                width: 10, height: 10,
                                borderRadius: '50%',
                                background: colors.bg,
                                flexShrink: 0,
                            }} />
                            <strong style={{ fontSize: '0.875rem', color: '#1a1a1a' }}>{house.zone}</strong>
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '0.6875rem',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: house.collected ? '#dcfce7' : '#fef3c7',
                                color: house.collected ? '#166534' : '#92400e',
                                fontWeight: 600,
                            }}>
                                {house.collected ? '✓ Collected' : '⏳ Pending'}
                            </span>
                        </div>

                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: '0 0 4px', color: '#1a1a1a' }}>
                            {house.donor}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>
                            <MapPin size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                            <span>{house.address}, Kolkata</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#666', marginBottom: '6px' }}>
                            <Phone size={12} style={{ flexShrink: 0 }} />
                            <span>{house.phone}</span>
                        </div>

                        {house.lastYear > 0 && (
                            <div style={{
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: '#f5f1eb',
                                color: '#92400e',
                                fontWeight: 500,
                                textAlign: 'center',
                            }}>
                                Last Year: ₹{house.lastYear.toLocaleString('en-IN')}
                            </div>
                        )}
                    </div>
                </InfoWindow>
            )}
        </>
    );
}

export default function HouseMap({ houses, height = '340px' }) {
    const [selectedHouse, setSelectedHouse] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const handleSelect = useCallback((house, marker) => {
        setSelectedHouse(house);
        setSelectedMarker(marker);
    }, []);

    // If no API key, show a helpful message instead of crashing
    if (!apiKey) {
        return (
            <div style={{
                height,
                background: 'linear-gradient(135deg, var(--bg-surface-sunken) 0%, var(--border-light) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px',
                color: 'var(--text-muted)', borderRadius: 'var(--radius-md)',
            }}>
                <MapPin size={32} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Google Maps API Key Required</span>
                <span style={{ fontSize: '0.75rem', maxWidth: '320px', textAlign: 'center' }}>
                    Add <code style={{ background: 'var(--bg-surface-sunken)', padding: '2px 6px', borderRadius: '4px' }}>VITE_GOOGLE_MAPS_API_KEY=your_key</code> to your <code>.env</code> file
                </span>
            </div>
        );
    }

    // Compute bounds to fit all markers
    const bounds = houses.reduce((acc, h) => {
        if (h.lat && h.lng) {
            acc.minLat = Math.min(acc.minLat, h.lat);
            acc.maxLat = Math.max(acc.maxLat, h.lat);
            acc.minLng = Math.min(acc.minLng, h.lng);
            acc.maxLng = Math.max(acc.maxLng, h.lng);
        }
        return acc;
    }, { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 });

    const center = houses.some(h => h.lat) ? {
        lat: (bounds.minLat + bounds.maxLat) / 2,
        lng: (bounds.minLng + bounds.maxLng) / 2,
    } : KOLKATA_CENTER;

    return (
        <APIProvider apiKey={apiKey}>
            <div style={{ height, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <Map
                    mapId="collectiq-houses-map"
                    defaultCenter={center}
                    defaultZoom={13}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    zoomControl={true}
                    mapTypeControl={false}
                    streetViewControl={false}
                    fullscreenControl={true}
                    style={{ width: '100%', height: '100%' }}
                >
                    {houses.filter(h => h.lat && h.lng).map(house => (
                        <HouseMarker
                            key={house.id}
                            house={house}
                            isSelected={selectedHouse?.id === house.id}
                            onSelect={handleSelect}
                        />
                    ))}
                </Map>
            </div>

            {/* Zone Legend */}
            <div style={{
                display: 'flex', gap: '16px', padding: '12px 16px',
                flexWrap: 'wrap', justifyContent: 'center',
            }}>
                {Object.entries(ZONE_COLORS).map(([zone, colors]) => (
                    <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: colors.bg, border: `2px solid ${colors.border}`,
                        }} />
                        {zone}
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#22c55e', border: '2px solid #16a34a',
                    }} />
                    Collected
                </div>
            </div>
        </APIProvider>
    );
}
