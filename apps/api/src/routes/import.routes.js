import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/v1/import/donors
 * Bulk import donor records with duplicate prevention and house linking
 */
router.post('/donors', roleGuard(['president', 'secretary', 'owner', 'admin']), async (req, res, next) => {
    try {
        const clubId = req.clubId;
        const rawDonors = req.body.donors;

        if (!Array.isArray(rawDonors) || rawDonors.length === 0) {
            return res.status(400).json({ error: 'Expected an array of donor records in `donors`' });
        }

        // Fetch existing donors in this club to check duplicates
        const { data: existingDonors } = await supabaseAdmin
            .from('donors')
            .select('id, full_name, phone')
            .eq('club_id', clubId);

        const existingPhoneSet = new Set(
            (existingDonors || [])
                .map((d) => (d.phone ? d.phone.replace(/[^0-9]/g, '').slice(-10) : null))
                .filter(Boolean)
        );

        const existingNameSet = new Set(
            (existingDonors || []).map((d) => d.full_name.trim().toLowerCase())
        );

        let importedCount = 0;
        const skippedDuplicates = [];

        for (const item of rawDonors) {
            const name = (item.full_name || item.name || '').trim();
            if (!name) continue;

            const rawPhone = item.phone || item.mobile || '';
            const cleanPhone = rawPhone.toString().replace(/[^0-9]/g, '');
            const phoneLast10 = cleanPhone.slice(-10);

            // Duplicate detection check
            if (phoneLast10 && existingPhoneSet.has(phoneLast10)) {
                skippedDuplicates.push({
                    name,
                    phone: rawPhone,
                    reason: 'Phone number already exists in your club database',
                });
                continue;
            }

            if (!cleanPhone && existingNameSet.has(name.toLowerCase())) {
                skippedDuplicates.push({
                    name,
                    phone: rawPhone,
                    reason: 'Exact donor name already registered in your club',
                });
                continue;
            }

            // Create House if address provided
            let houseId = null;
            const address = (item.address || item.address_line || item.zone || '').trim();
            if (address) {
                const { data: houseData } = await supabaseAdmin
                    .from('houses')
                    .insert({
                        club_id: clubId,
                        address_line: address,
                        landmark: item.landmark || null,
                        expected_amount: Number(item.expected_amount) || Number(item.amount) || 0,
                    })
                    .select('id')
                    .single();

                if (houseData) {
                    houseId = houseData.id;
                }
            }

            // Insert Donor
            const { data: newDonor, error: donorErr } = await supabaseAdmin
                .from('donors')
                .insert({
                    club_id: clubId,
                    full_name: name,
                    phone: cleanPhone || null,
                    email: item.email || null,
                    house_id: houseId,
                    preferred_payment_mode: (item.payment_mode || 'CASH').toUpperCase(),
                })
                .select('id')
                .single();

            if (!donorErr && newDonor) {
                importedCount++;
                if (phoneLast10) existingPhoneSet.add(phoneLast10);
                existingNameSet.add(name.toLowerCase());

                // If initial donation is marked PAID and amount provided, record it
                const amount = Number(item.amount) || Number(item.collected_amount) || 0;
                const status = (item.status || item.payment_status || '').toUpperCase();
                if (amount > 0 && status === 'PAID') {
                    // Record in collection ledger
                    await supabaseAdmin
                        .from('collection_ledgers')
                        .insert({
                            campaign_id: item.campaign_id || req.body.campaign_id || '00000000-0000-0000-0000-000000000000',
                            donor_id: newDonor.id,
                            collector_id: req.user?.id,
                            promised_amount: amount,
                            collected_amount: amount,
                            payment_status: 'PAID',
                            payment_mode: (item.payment_mode || 'CASH').toUpperCase(),
                        });
                }
            }
        }

        res.json({
            message: `Successfully imported ${importedCount} donors.`,
            imported_count: importedCount,
            duplicate_count: skippedDuplicates.length,
            duplicates: skippedDuplicates,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
