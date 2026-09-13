import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';
import { compareDonorNames } from '../services/phoneticMatcher.js';

const router = Router();

/**
 * GET /api/v1/donors/:id/profile
 * Returns detailed donor historical profile, lifetime analytics, preferred mode, YoY contribution
 */
router.get('/:id/profile', async (req, res, next) => {
    try {
        const donorId = req.params.id;

        // Try PostgreSQL stored procedure first
        try {
            const { data: profileRpc, error: rpcErr } = await supabaseAdmin
                .rpc('get_donor_profile', { p_donor_id: donorId });

            if (!rpcErr && profileRpc) {
                return res.json({ data: profileRpc });
            }
        } catch (rpcEx) {
            console.warn('RPC get_donor_profile unavailable, falling back to JS query aggregator:', rpcEx.message);
        }

        // JS Fallback aggregator
        const { data: donor, error: donorErr } = await supabaseAdmin
            .from('donors')
            .select(`
                *,
                house:houses(*)
            `)
            .eq('id', donorId)
            .single();

        if (donorErr || !donor) {
            return res.status(404).json({ error: 'Donor not found' });
        }

        // Fetch donations for this donor
        const { data: donations } = await supabaseAdmin
            .from('donations')
            .select('*')
            .eq('donor_id', donorId)
            .eq('is_void', false)
            .order('created_at', { ascending: false });

        const donList = donations || [];
        const totalLifetime = donList.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const totalCount = donList.length;
        const avgAmount = totalCount > 0 ? Math.round(totalLifetime / totalCount) : 0;
        const maxAmount = donList.reduce((max, d) => Math.max(max, Number(d.amount) || 0), 0);

        // Compute preferred payment method
        const modeCounts = {};
        donList.forEach((d) => {
            const m = (d.payment_method || 'CASH').toUpperCase();
            modeCounts[m] = (modeCounts[m] || 0) + 1;
        });
        let preferredMode = 'CASH';
        let maxCount = 0;
        Object.entries(modeCounts).forEach(([m, count]) => {
            if (count > maxCount) {
                maxCount = count;
                preferredMode = m;
            }
        });

        // Pending records from collection ledgers
        const { data: ledgers } = await supabaseAdmin
            .from('collection_ledgers')
            .select('*')
            .eq('donor_id', donorId)
            .neq('payment_status', 'PAID');

        const pendingList = ledgers || [];
        const pendingAmount = pendingList.reduce(
            (sum, l) => sum + Math.max(0, (Number(l.promised_amount) || 0) - (Number(l.collected_amount) || 0)),
            0
        );

        // Classification
        let classification = 'REGULAR';
        if (totalLifetime >= 10000 || maxAmount >= 5000) {
            classification = 'HIGH_VALUE';
        } else if (totalCount === 0) {
            classification = 'NEW';
        } else if (pendingList.length > 0) {
            classification = 'NEEDS_FOLLOWUP';
        }

        // YoY history
        const yoyMap = {};
        donList.forEach((d) => {
            const yr = new Date(d.created_at).getFullYear();
            yoyMap[yr] = (yoyMap[yr] || 0) + (Number(d.amount) || 0);
        });
        const yoyHistory = Object.entries(yoyMap)
            .map(([year, amount]) => ({ year: parseInt(year, 10), amount }))
            .sort((a, b) => a.year - b.year);

        const profile = {
            donor_id: donor.id,
            full_name: donor.full_name,
            phone: donor.phone,
            email: donor.email,
            house_id: donor.house_id,
            house: donor.house,
            total_lifetime_amount: totalLifetime,
            total_donations_count: totalCount,
            average_donation: avgAmount,
            highest_donation: maxAmount,
            preferred_payment_mode: preferredMode,
            pending_amount: pendingAmount,
            pending_count: pendingList.length,
            last_donation_date: donList[0]?.created_at || null,
            classification,
            yoy_history: yoyHistory,
            recent_donations: donList.slice(0, 10),
        };

        res.json({ data: profile });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/donors/duplicates
 * Fuzzy/exact match detection before creating a new donor record
 */
router.get('/duplicates', async (req, res, next) => {
    try {
        const { name = '', phone = '' } = req.query;
        const clubId = req.clubId;

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const cleanName = name.trim();

        if (!cleanPhone && cleanName.length < 2) {
            return res.json({ duplicates: [] });
        }

        const duplicates = [];

        // 1. Phone match (Exact or last 10 digits)
        if (cleanPhone.length >= 7) {
            const searchPhone = cleanPhone.slice(-10);
            const { data: phoneMatches } = await supabaseAdmin
                .from('donors')
                .select('id, full_name, phone, house_id, houses(address_line, landmark)')
                .eq('club_id', clubId)
                .ilike('phone', `%${searchPhone}%`)
                .limit(5);

            (phoneMatches || []).forEach((d) => {
                duplicates.push({
                    donor: d,
                    match_type: 'PHONE_MATCH',
                    confidence: 0.95,
                    reason: `Phone number matches ${d.phone}`,
                });
            });
        }

        // 2. Name match (Phonetic Metaphone + Jaro-Winkler + Alias)
        if (cleanName.length >= 3) {
            // Fetch club donors to test phonetic & spelling variations
            const { data: clubDonors } = await supabaseAdmin
                .from('donors')
                .select('id, full_name, phone, house_id, houses(address_line, landmark)')
                .eq('club_id', clubId)
                .limit(80);

            (clubDonors || []).forEach((d) => {
                const alreadyAdded = duplicates.some((item) => item.donor.id === d.id);
                if (alreadyAdded) return;

                const comp = compareDonorNames(cleanName, d.full_name);
                if (comp.isMatch) {
                    duplicates.push({
                        donor: d,
                        match_type: comp.match_type,
                        confidence: comp.confidence,
                        reason: comp.reason,
                    });
                }
            });

            // Sort duplicates descending by confidence
            duplicates.sort((a, b) => b.confidence - a.confidence);
        }

        res.json({ duplicates: duplicates.slice(0, 8) });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/donors/overview/stats
 * Aggregate segmentation summary for the entire club
 */
router.get('/overview/stats', async (req, res, next) => {
    try {
        const clubId = req.clubId;

        const { data: donors } = await supabaseAdmin
            .from('donors')
            .select('id')
            .eq('club_id', clubId);

        const donorCount = donors?.length || 0;

        const { data: donations } = await supabaseAdmin
            .from('donations')
            .select('donor_id, amount, payment_method, created_at')
            .eq('club_id', clubId)
            .eq('is_void', false);

        const donList = donations || [];
        const donorSumMap = {};
        donList.forEach((d) => {
            donorSumMap[d.donor_id] = (donorSumMap[d.donor_id] || 0) + (Number(d.amount) || 0);
        });

        let highValueCount = 0;
        let regularCount = 0;
        let newCount = 0;

        Object.values(donorSumMap).forEach((sum) => {
            if (sum >= 10000) highValueCount++;
            else regularCount++;
        });

        newCount = Math.max(0, donorCount - Object.keys(donorSumMap).length);

        res.json({
            data: {
                total_donors: donorCount,
                high_value_donors: highValueCount,
                regular_donors: regularCount,
                new_donors: newCount,
            },
        });
    } catch (err) {
        next(err);
    }
});

export default router;
