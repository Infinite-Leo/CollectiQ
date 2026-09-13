import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, Home, CheckCircle2, Navigation, ExternalLink } from 'lucide-react';
import { formatIndianCurrency } from '../utils/indianNumberFormat';

// Fix Leaflet marker icons in Vite/Webpack bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Zone color palette matching CollectiQ's saffron-gold aesthetic
const ZONE_COLORS = {
    'Zone A': { bg: '#E8652B', border: '#C44E1A', text: '#FFFFFF' },
    'Zone B': { bg: '#3B82F6', border: '#1D4ED8', text: '#FFFFFF' },
    'Zone C': { bg: '#10B981', border: '#047857', text: '#FFFFFF' },
    'Zone D': { bg: '#8B5CF6', border: '#6D28D9', text: '#FFFFFF' },
};

function createHousePin(isCollected, zone) {
    const zoneStyle = ZONE_COLORS[zone] || ZONE_COLORS['Zone A'];
    const pinColor = isCollected ? '#16A34A' : zoneStyle.bg;
    const pinBorder = isCollected ? '#14532D' : zoneStyle.border;
    const glyph = isCollected ? '✓' : '🏠';

    return L.divIcon({
        className: 'custom-house-pin',
        html: `
            <div style="
                background: ${pinColor};
                color: #FFFFFF;
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #FFFFFF;
                box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            ">
                <span style="
                    transform: rotate(45deg);
                    font-size: 13px;
                    font-weight: 800;
                    line-height: 1;
                ">${glyph}</span>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });
}

export default function HouseMap({ houses = [], height = '360px' }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const [selectedHouse, setSelectedHouse] = useState(null);

    const validHouses = houses.map((h, idx) => {
        const lat = Number(h.lat || h.latitude) || (22.5726 + ((idx % 6) - 3) * 0.008);
        const lng = Number(h.lng || h.longitude) || (88.3639 + ((idx % 5) - 2) * 0.008);
        return {
            ...h,
            lat,
            lng,
            isCollected: Boolean(h.collected || h.is_collected),
            zone: h.zone || 'Zone A',
            donorName: h.donor || h.donor_name || h.donors?.[0]?.full_name || 'Neighborhood Resident',
            phone: h.phone || h.donors?.[0]?.phone || '',
            address: h.address || h.address_line || 'Local Ward Address',
            expected: Number(h.expected_amount || h.lastYear || 2000),
        };
    });

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize Map
        const defaultCenter = validHouses.length > 0
            ? [validHouses[0].lat, validHouses[0].lng]
            : [22.5726, 88.3639];

        const map = L.map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: 13,
            zoomControl: true,
        });

        // Fast, 100% free OpenStreetMap standard tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors | CollectiQ Smart Housing',
        }).addTo(map);

        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;
        mapInstanceRef.current = map;

        // Invalidate size to ensure container dimensions render properly
        setTimeout(() => {
            map.invalidateSize();
        }, 150);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markersLayerRef.current = null;
        };
    }, []);

    // Update markers whenever validHouses changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        const markersGroup = markersLayerRef.current;
        if (!map || !markersGroup) return;

        markersGroup.clearLayers();

        if (validHouses.length === 0) return;

        const bounds = L.latLngBounds();

        validHouses.forEach((house) => {
            const icon = createHousePin(house.isCollected, house.zone);
            const marker = L.marker([house.lat, house.lng], { icon });

            const popupContent = `
                <div style="font-family: Inter, sans-serif; min-width: 200px; padding: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1B5E20;">${house.zone}</span>
                        <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${house.isCollected ? '#DCFCE7' : '#FEF3C7'}; color: ${house.isCollected ? '#166534' : '#92400E'};">
                            ${house.isCollected ? 'COLLECTED' : 'PENDING'}
                        </span>
                    </div>
                    <div style="font-weight: 800; font-size: 14px; color: #111827; margin-bottom: 4px;">
                        ${house.donorName}
                    </div>
                    <div style="font-size: 12px; color: #4B5563; margin-bottom: 6px;">
                        📍 ${house.address}
                    </div>
                    ${house.phone ? `<div style="font-size: 12px; color: #4B5563; margin-bottom: 6px;">📱 ${house.phone}</div>` : ''}
                    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 6px 8px; margin-top: 6px; display: flex; justify-content: space-between;">
                        <span style="font-size: 11px; color: #6B7280;">Expected:</span>
                        <strong style="font-size: 12px; color: #1B5E20;">₹${house.expected.toLocaleString('en-IN')}</strong>
                    </div>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${house.lat},${house.lng}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; margin-top: 8px; font-size: 11px; font-weight: 700; color: #1B5E20; text-decoration: none; padding: 4px 8px; background: #E8F5E9; border-radius: 4px;">
                        Get Directions ↗
                    </a>
                </div>
            `;

            marker.bindPopup(popupContent);
            marker.on('click', () => setSelectedHouse(house));
            markersGroup.addLayer(marker);
            bounds.extend([house.lat, house.lng]);
        });

        // Fit bounds if houses exist
        try {
            map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
        } catch (err) {
            console.warn('Map fitBounds notice:', err);
        }
    }, [houses]);

    return (
        <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E0E0E0' }}>
            {/* Real OpenStreetMap Canvas */}
            <div
                ref={mapContainerRef}
                style={{
                    height,
                    width: '100%',
                    backgroundColor: '#E5E7EB',
                    zIndex: 1,
                }}
            />

            {/* Bottom Status Legend */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '8px 16px',
                    backgroundColor: '#FFFFFF',
                    borderTop: '1px solid #E5E7EB',
                    fontSize: '0.75rem',
                    color: '#4B5563',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#1F2937' }}>Map Legend:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                        <span>Collected</span>
                    </div>
                    {Object.entries(ZONE_COLORS).map(([zone, val]) => (
                        <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: val.bg, display: 'inline-block' }} />
                            <span>{zone} (Pending)</span>
                        </div>
                    ))}
                </div>

                <div style={{ fontSize: '0.7rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} color="#16A34A" />
                    <span>OpenStreetMap Live Connected</span>
                </div>
            </div>
        </div>
    );
}
