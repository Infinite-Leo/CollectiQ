import { createContext, useContext, useState, useMemo, useCallback } from 'react';

// ── Seed Data ────────────────────────────────────────────────────
// Mirrors the existing hardcoded data across pages so the app feels
// populated from the start, but now it's all in ONE place.

const SEED_DONORS = [
    { id: 'd1', full_name: 'Rajesh Banerjee', phone: '+91 98321 45678', zone: 'Zone A', created_at: '2026-10-01T10:00:00Z' },
    { id: 'd2', full_name: 'Sunita Devi', phone: '+91 98765 43210', zone: 'Zone B', created_at: '2026-10-01T10:00:00Z' },
    { id: 'd3', full_name: 'Amit Poddar', phone: '+91 90876 54321', zone: 'Zone A', created_at: '2026-10-01T10:00:00Z' },
    { id: 'd4', full_name: 'Kavita Roy', phone: '+91 87654 32109', zone: 'Zone C', created_at: '2026-10-01T10:00:00Z' },
    { id: 'd5', full_name: 'Dipak Mandal', phone: '+91 76543 21098', zone: 'Zone B', created_at: '2026-10-01T10:00:00Z' },
    { id: 'd6', full_name: 'Meena Agarwal', phone: '+91 65432 10987', zone: 'Zone A', created_at: '2026-10-01T10:00:00Z' },
    { id: 'd7', full_name: 'Suresh Patel', phone: '+91 54321 09876', zone: 'Zone D', created_at: '2026-10-01T10:00:00Z' },
    { id: 'd8', full_name: 'Lalita Ghosh', phone: '+91 43210 98765', zone: 'Zone A', created_at: '2026-10-01T10:00:00Z' },
];

const SEED_COLLECTORS = [
    { id: 'c1', name: 'Ravi Kumar', zone: 'Zone A', count: 38, dues: 2400, lastActive: 'Now', status: 'active', phone: '+91 98321 11111', since: 'Oct 2023' },
    { id: 'c2', name: 'Priya Sen', zone: 'Zone A', count: 32, dues: 0, lastActive: '10 min ago', status: 'active', phone: '+91 98321 22222', since: 'Oct 2023' },
    { id: 'c3', name: 'Ankit Sharma', zone: 'Zone B', count: 28, dues: 5600, lastActive: '1 hr ago', status: 'active', phone: '+91 98321 33333', since: 'Oct 2024' },
    { id: 'c4', name: 'Sneha Das', zone: 'Zone B', count: 22, dues: 0, lastActive: '30 min ago', status: 'active', phone: '+91 98321 44444', since: 'Oct 2024' },
    { id: 'c5', name: 'Manoj Ghosh', zone: 'Zone C', count: 19, dues: 3200, lastActive: '2 hrs ago', status: 'active', phone: '+91 98321 55555', since: 'Oct 2025' },
    { id: 'c6', name: 'Suman Roy', zone: 'Zone D', count: 14, dues: 7200, lastActive: '1 day ago', status: 'inactive', phone: '+91 65432 10987', since: 'Oct 2024' },
];

const SEED_HOUSES = [
    { id: 'h1', address: '12/A, Maniktala Main Rd', donor: 'Rajesh Banerjee', phone: '+91 98321 45678', zone: 'Zone A', lastYear: 5000, collected: true, priority: 'high', lat: 22.5876, lng: 88.3775 },
    { id: 'h2', address: '45, Lake Town Block B', donor: 'Sunita Devi', phone: '+91 98765 43210', zone: 'Zone B', lastYear: 2000, collected: true, priority: 'normal', lat: 22.5997, lng: 88.4013 },
    { id: 'h3', address: '78/3, Bagmari Rd', donor: 'Amit Poddar', phone: '+91 90876 54321', zone: 'Zone A', lastYear: 10000, collected: false, priority: 'critical', lat: 22.5742, lng: 88.3741 },
    { id: 'h4', address: '22, Dum Dum Park', donor: 'Kavita Roy', phone: '+91 87654 32109', zone: 'Zone C', lastYear: 1500, collected: false, priority: 'normal', lat: 22.6197, lng: 88.4098 },
    { id: 'h5', address: '56, Shyambazar 5 Point', donor: 'Dipak Mandal', phone: '+91 76543 21098', zone: 'Zone B', lastYear: 3000, collected: false, priority: 'high', lat: 22.5953, lng: 88.3730 },
    { id: 'h6', address: '9, Gariahat Rd South', donor: 'Meena Agarwal', phone: '+91 65432 10987', zone: 'Zone A', lastYear: 7500, collected: true, priority: 'normal', lat: 22.5168, lng: 88.3665 },
    { id: 'h7', address: '101, Salt Lake Sector V', donor: 'Suresh Patel', phone: '+91 54321 09876', zone: 'Zone D', lastYear: 2500, collected: false, priority: 'low', lat: 22.5724, lng: 88.4348 },
    { id: 'h8', address: '34, Jadavpur Station Rd', donor: 'Lalita Ghosh', phone: '+91 43210 98765', zone: 'Zone A', lastYear: 4000, collected: true, priority: 'normal', lat: 22.4988, lng: 88.3706 },
];

// Generate 10 days of seed donations so the trend chart has data
function generateSeedDonations() {
    const donations = [];
    let receiptNum = 248;
    const modes = ['cash', 'upi', 'bank_transfer'];
    const collectors = ['Ravi Kumar', 'Priya Sen', 'Ankit Sharma', 'Sneha Das', 'Manoj Ghosh'];

    // Past 10 days of donations
    for (let dayOffset = 9; dayOffset >= 0; dayOffset--) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        const perDay = dayOffset === 0 ? 3 : Math.floor(Math.random() * 4) + 2;

        for (let j = 0; j < perDay; j++) {
            const donor = SEED_DONORS[Math.floor(Math.random() * SEED_DONORS.length)];
            const collector = collectors[Math.floor(Math.random() * collectors.length)];
            const mode = modes[Math.floor(Math.random() * modes.length)];
            const amount = [1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000][Math.floor(Math.random() * 8)];
            receiptNum++;
            const d = new Date(date);
            d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

            donations.push({
                id: `don-${receiptNum}`,
                receipt: `DNC-DP26-${String(receiptNum).padStart(6, '0')}`,
                donor: donor.full_name,
                donor_id: donor.id,
                collector,
                zone: donor.zone || 'Zone A',
                amount,
                mode,
                status: Math.random() > 0.1 ? 'paid' : 'due',
                date: d.toISOString(),
            });
        }
    }
    return donations;
}

const SEED_DONATIONS = generateSeedDonations();

// ── Context ──────────────────────────────────────────────────────

const AppDataContext = createContext(null);

export function useAppData() {
    const ctx = useContext(AppDataContext);
    if (!ctx) throw new Error('useAppData must be used within <AppDataProvider>');
    return ctx;
}

export function AppDataProvider({ children }) {
    const [donors, setDonors] = useState(SEED_DONORS);
    const [donations, setDonations] = useState(SEED_DONATIONS);
    const [houses, setHouses] = useState(SEED_HOUSES);
    const [collectors] = useState(SEED_COLLECTORS);

    // ── Receipt counter ───────────────────────────────────
    const nextReceiptNum = useMemo(() => {
        const nums = donations.map(d => {
            const m = d.receipt.match(/(\d+)$/);
            return m ? parseInt(m[1], 10) : 0;
        });
        return Math.max(...nums, 300) + 1;
    }, [donations]);

    // ── Mutations ─────────────────────────────────────────
    const addDonor = useCallback((donor) => {
        const newDonor = {
            id: `d-${Date.now()}`,
            full_name: donor.full_name,
            phone: donor.phone || null,
            zone: donor.zone || null,
            created_at: new Date().toISOString(),
        };
        setDonors(prev => [...prev, newDonor]);
        return newDonor;
    }, []);

    const addDonation = useCallback((donation) => {
        const receipt = `DNC-DP26-${String(nextReceiptNum).padStart(6, '0')}`;
        const newDonation = {
            id: `don-${Date.now()}`,
            receipt,
            donor: donation.donor,
            donor_id: donation.donor_id || null,
            collector: donation.collector || 'You',
            zone: donation.zone || '-',
            amount: parseFloat(donation.amount),
            mode: donation.mode || 'cash',
            status: donation.status || 'paid',
            date: new Date().toISOString(),
        };
        setDonations(prev => [newDonation, ...prev]);
        return newDonation;
    }, [nextReceiptNum]);

    const addHouse = useCallback((house) => {
        const newHouse = {
            id: `h-${Date.now()}`,
            ...house,
            collected: false,
        };
        setHouses(prev => [...prev, newHouse]);
        return newHouse;
    }, []);

    const toggleHouseCollected = useCallback((houseId) => {
        setHouses(prev => prev.map(h =>
            h.id === houseId ? { ...h, collected: !h.collected } : h
        ));
    }, []);

    // ── Computed Values ────────────────────────────────────
    const stats = useMemo(() => {
        const totalCollection = donations
            .filter(d => d.status === 'paid')
            .reduce((sum, d) => sum + d.amount, 0);

        const today = new Date().toDateString();
        const todaysCollection = donations
            .filter(d => d.status === 'paid' && new Date(d.date).toDateString() === today)
            .reduce((sum, d) => sum + d.amount, 0);

        const pendingHouses = houses.filter(h => !h.collected).length;
        const collectedHouses = houses.filter(h => h.collected).length;
        const activeCollectors = collectors.filter(c => c.status === 'active').length;

        // Payment split
        const cashTotal = donations.filter(d => d.mode === 'cash' && d.status === 'paid').reduce((s, d) => s + d.amount, 0);
        const upiTotal = donations.filter(d => d.mode === 'upi' && d.status === 'paid').reduce((s, d) => s + d.amount, 0);
        const bankTotal = donations.filter(d => d.mode === 'bank_transfer' && d.status === 'paid').reduce((s, d) => s + d.amount, 0);
        const total = cashTotal + upiTotal + bankTotal || 1;

        const paymentSplit = [
            { name: 'Cash', value: Math.round((cashTotal / total) * 100), color: '#D97706' },
            { name: 'UPI', value: Math.round((upiTotal / total) * 100), color: '#3B82F6' },
            { name: 'Bank Transfer', value: Math.round((bankTotal / total) * 100), color: '#10B981' },
        ];

        return {
            totalCollection,
            todaysCollection,
            pendingHouses,
            collectedHouses,
            totalHouses: houses.length,
            activeCollectors,
            totalDonations: donations.length,
            paymentSplit,
        };
    }, [donations, houses, collectors]);

    // Trend data grouped by date
    const trendData = useMemo(() => {
        const grouped = {};
        donations.filter(d => d.status === 'paid').forEach(d => {
            const dateKey = new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            grouped[dateKey] = (grouped[dateKey] || 0) + d.amount;
        });
        return Object.entries(grouped)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => {
                // Parse the date for proper sorting
                const parseShort = (s) => {
                    const parts = s.split(' ');
                    const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
                    return new Date(2026, months[parts[1]] || 0, parseInt(parts[0]));
                };
                return parseShort(a.date) - parseShort(b.date);
            });
    }, [donations]);

    // Top collectors ranked by collections
    const collectorRanking = useMemo(() => {
        const amounts = {};
        donations.filter(d => d.status === 'paid').forEach(d => {
            if (d.collector) amounts[d.collector] = (amounts[d.collector] || 0) + d.amount;
        });
        return Object.entries(amounts)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [donations]);

    // Recent donations (latest 5)
    const recentDonations = useMemo(() => {
        return [...donations]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map(d => ({
                ...d,
                time: getRelativeTime(d.date),
            }));
    }, [donations]);

    const value = {
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
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}
