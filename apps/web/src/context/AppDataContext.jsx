import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);

export function useAppData() {
    const ctx = useContext(AppDataContext);
    if (!ctx) throw new Error('useAppData must be used within <AppDataProvider>');
    return ctx;
}

export function AppDataProvider({ children }) {
    const { isAuthenticated, session } = useAuth();
    
    const [donors, setDonors] = useState([]);
    const [donations, setDonations] = useState([]);
    const [houses, setHouses] = useState([]);
    const [collectors, setCollectors] = useState([]);
    
    // Aggregated stats from backend /api/dashboard/summary
    const [dashboardStats, setDashboardStats] = useState({
        total_collection: 0,
        total_donations: 0,
        today_collection: 0,
        today_donations: 0,
        total_houses: 0,
        collected_houses: 0,
        pending_houses: 0
    });
    
    const [trendData, setTrendData] = useState([]);
    const [paymentSplit, setPaymentSplit] = useState([]);
    const [collectorRanking, setCollectorRanking] = useState([]);
    
    const [loading, setLoading] = useState(true);

    // Initial Data Load
    useEffect(() => {
        if (!isAuthenticated) return;
        
        async function loadData() {
            setLoading(true);
            try {
                // Determine event_id (you might have a central 'active_event_id' setting)
                // For now, we will query without it and let the backend default appropriately
                const [
                    donorsRes,
                    donationsRes,
                    housesRes,
                    summaryRes,
                    trendRes,
                    splitRes,
                    collectorRes
                ] = await Promise.all([
                    apiFetch('/api/donors'),
                    apiFetch('/api/donations?limit=100'), // Load recent donations
                    apiFetch('/api/houses'),
                    apiFetch('/api/dashboard/summary'),
                    apiFetch('/api/dashboard/trend?days=10'),
                    apiFetch('/api/dashboard/payment-split'),
                    apiFetch('/api/dashboard/collector-stats')
                ]);

                if (donorsRes.data) {
                    setDonors(donorsRes.data.map(d => ({
                        ...d,
                        zone: d.zones?.name || 'Zone A'
                    })));
                }
                
                if (donationsRes.data) {
                    setDonations(donationsRes.data.map(d => ({
                        ...d,
                        receipt: d.receipt_number,
                        donor: d.donors?.full_name || '-',
                        collector: d.users?.full_name || 'Collector',
                        zone: d.zones?.name || '-',
                        mode: d.payment_mode,
                        date: d.created_at
                    })));
                }

                if (housesRes.data) {
                    setHouses(housesRes.data.map(h => ({
                        ...h,
                        collected: h.is_collected,
                        lastYear: h.last_year || 0,
                        zone: h.zones?.name || 'Zone A',
                        donor: h.donors?.full_name || h.donor_name || 'Guest',
                        phone: h.donors?.phone || h.phone || '-'
                    })));
                }
                if (summaryRes) setDashboardStats(summaryRes);
                if (trendRes.data) {
                    setTrendData(trendRes.data.map(t => ({ date: t.date, amount: t.total_amount })));
                }
                if (splitRes.data) {
                    // Standardize payment split for pie chart
                    const split = splitRes.data.map(s => ({
                        name: s.payment_mode === 'bank_transfer' ? 'Bank Transfer' : s.payment_mode.toUpperCase(),
                        value: s.count,
                        color: s.payment_mode === 'cash' ? '#D97706' : s.payment_mode === 'upi' ? '#3B82F6' : '#10B981'
                    }));
                    if (split.length > 0) setPaymentSplit(split);
                }
                if (collectorRes.data) {
                    setCollectorRanking(collectorRes.data.map(c => ({ name: c.collector_name || 'Unknown', amount: c.total_amount })));
                }

            } catch (err) {
                console.error("Failed to fetch app data:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [isAuthenticated, session]);


    // ── Mutations ─────────────────────────────────────────
    
    const addDonor = useCallback(async (donor) => {
        try {
            const payload = { full_name: donor.full_name, phone: donor.phone };
            const res = await apiFetch('/api/donors', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.data) {
                setDonors(prev => [...prev, { ...res.data, zone: 'Zone A' }]);
                return res.data;
            }
        } catch (err) {
            console.error("Failed to add donor:", err);
            throw err;
        }
    }, []);

    const addDonation = useCallback(async (donation) => {
        try {
            const payload = {
                amount: parseFloat(donation.amount),
                payment_mode: donation.mode || 'cash',
                donor_id: donation.donor_id || null,
                payment_status: donation.status || 'paid'
            };
            const res = await apiFetch('/api/donations', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.data) {
                const newDonation = {
                    ...res.data,
                    receipt: res.data.receipt_number,
                    donor: donation.donor,
                    mode: res.data.payment_mode,
                    date: res.data.created_at
                };
                setDonations(prev => [newDonation, ...prev]);
                const summaryRes = await apiFetch('/api/dashboard/summary').catch(() => null);
                if (summaryRes) setDashboardStats(summaryRes);
                return res.data;
            }
        } catch (err) {
            console.error("Failed to add donation:", err);
            throw err;
        }
    }, []);

    const addHouse = useCallback(async (house) => {
        try {
            const payload = {
                address_line: house.address,
                donor_name: house.donor,
                phone: house.phone,
                priority: house.priority || 'normal',
                last_year_amount: house.lastYear || 0,
                latitude: house.lat,
                longitude: house.lng
            };
            const res = await apiFetch('/api/houses', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.data) {
                setHouses(prev => [...prev, {
                    ...res.data,
                    collected: res.data.is_collected,
                    lastYear: res.data.last_year,
                    donor: res.data.donor_name
                }]);
                return res.data;
            }
        } catch (err) {
            console.error("Failed to add house:", err);
            throw err;
        }
    }, []);

    const toggleHouseCollected = useCallback(async (houseId) => {
        const house = houses.find(h => h.id === houseId);
        if (!house) return;

        const newCollectedState = !house.is_collected;

        // Optimistic update
        setHouses(prev => prev.map(h =>
            h.id === houseId ? { ...h, is_collected: newCollectedState } : h
        ));

        try {
            await apiFetch(`/api/houses/${houseId}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_collected: newCollectedState })
            });
        } catch (err) {
            console.error("Failed to toggle house status:", err);
            // Revert on failure
            setHouses(prev => prev.map(h =>
                h.id === houseId ? { ...h, is_collected: house.is_collected } : h
            ));
        }
    }, [houses]);

    // ── Computed Values ────────────────────────────────────
    
    // We map the backend dashboardStats to the keys the UI expects
    const stats = useMemo(() => ({
        totalCollection: dashboardStats.total_collection,
        todaysCollection: dashboardStats.today_collection,
        pendingHouses: dashboardStats.pending_houses,
        collectedHouses: dashboardStats.collected_houses,
        totalHouses: dashboardStats.total_houses,
        activeCollectors: collectors.length, // or fetch active collectors count
        totalDonations: dashboardStats.total_donations,
        paymentSplit: paymentSplit,
    }), [dashboardStats, paymentSplit, collectors]);

    // Recent donations (latest 5) maps backend schema to frontend expectation
    const recentDonations = useMemo(() => {
        return donations.slice(0, 5).map(d => ({
            id: d.id,
            receipt: d.receipt_number,
            donor: d.donor_id ? donors.find(x => x.id === d.donor_id)?.full_name : 'Guest',
            donor_id: d.donor_id,
            collector: d.collector_id ? 'Collector' : 'You',
            zone: '-',
            amount: d.amount,
            mode: d.payment_mode || 'cash',
            status: d.status || 'paid',
            date: d.created_at,
            time: getRelativeTime(d.created_at),
        }));
    }, [donations, donors]);

    const value = {
        isLoadingAppData: loading,
        // Raw data
        donors, donations, houses, collectors,
        // Mutations
        addDonor, addDonation, addHouse, toggleHouseCollected,
        // Computed
        stats, trendData, collectorRanking, recentDonations,
    };

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
}

// ── Helpers ──────────────────────────────────────────────────────
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
