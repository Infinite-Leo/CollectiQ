import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { requireAppUser, roleGuard } from '../middleware/auth.js';
import { PAYMENT_MODES, PAYMENT_STATUSES } from '../constants/paymentModes.js';

const router = Router();

function isReceiptConflict(error) {
    if (error?.code !== '23505') return false;

    const receiptMarkers = [
        error.constraint,
        error.message,
        error.details,
        error.hint,
    ].filter(Boolean);

    return receiptMarkers.some((value) => value.toLowerCase().includes('receipt'));
}

async function getNextReceiptNumber(clubId, eventId) {
    const { data, error } = await supabaseAdmin
        .rpc('next_receipt_number', { p_club_id: clubId, p_event_id: eventId });

    if (error) {
        console.error('Receipt number generation error:', error);
        throw error;
    }

    return data;
}

async function insertDonationWithRetry(supabase, payload, maxAttempts = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const receiptNumber = await getNextReceiptNumber(payload.club_id, payload.event_id);
        const { data, error } = await supabase
            .from('donations')
            .insert({
                ...payload,
                receipt_number: receiptNumber,
            })
            .select()
            .single();

        if (!error) {
            return data;
        }

        if (!isReceiptConflict(error) || attempt === maxAttempts) {
            console.error('Donation insert error:', error);
            throw error;
        }

        lastError = error;
    }

    throw lastError;
}

// POST /api/donations — Record a new donation (transactional)
router.post('/', roleGuard(['president', 'secretary', 'collector']), requireAppUser, async (req, res, next) => {
    try {
        const {
            event_id, donor_id, zone_id, house_id,
            amount, payment_mode, payment_status,
            idempotency_key, notes, collection_lat, collection_lng, device_id,
        } = req.body;

        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;

        // Ensure event_id exists
        let finalEventId = event_id;
        if (!finalEventId) {
            const { data: activeEvent, error: eventErr } = await supabaseAdmin
                .from('events')
                .select('id')
                .eq('club_id', req.clubId)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (eventErr || !activeEvent) {
                return res.status(400).json({ error: 'No active event found. Please create or start an event first.' });
            }
            finalEventId = activeEvent.id;
        }

        // Insert donation
        const data = await insertDonationWithRetry(supabase, {
            club_id: req.clubId,
            event_id: finalEventId,
            donor_id,
            collector_id: req.appUserId,
            zone_id: zone_id || null,
            house_id: house_id || null,
            amount,
            payment_mode: payment_mode || PAYMENT_MODES.CASH,
            payment_status: payment_status || PAYMENT_STATUSES.PAID,
            idempotency_key: idempotency_key || null,
            notes: notes || null,
            collection_lat: collection_lat || null,
            collection_lng: collection_lng || null,
            device_id: device_id || null,
        });

        // Mark house as collected if applicable
        if (house_id) {
            await supabaseAdmin
                .from('houses')
                .update({ is_collected: true })
                .eq('id', house_id)
                .eq('club_id', req.clubId);
        }

        res.status(201).json({ data, receipt_number: data.receipt_number });
    } catch (err) {
        next(err);
    }
});

// GET /api/donations — List donations (paginated, filtered)
router.get('/', roleGuard(['president', 'secretary', 'cashier', 'collector']), async (req, res, next) => {
    try {
        const { event_id, payment_status, payment_mode, collector_id, page = 1, limit = 50 } = req.query;

        // We use the admin client for the relational joins here, but preserve
        // the same visibility rules as the database policies.
        let query = supabaseAdmin
            .from('donations')
            .select('*, donors(full_name), users!collector_id(full_name), zones(name)', { count: 'exact' })
            .eq('club_id', req.clubId)
            .eq('is_void', false)
            .order('collected_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (req.userRole === 'collector') {
            if (!req.appUserId) {
                return res.status(403).json({ error: 'User profile is not provisioned for this account yet' });
            }
            query = query.eq('collector_id', req.appUserId);
        }

        if (event_id) query = query.eq('event_id', event_id);
        if (payment_status) query = query.eq('payment_status', payment_status);
        if (payment_mode) query = query.eq('payment_mode', payment_mode);
        if (collector_id) query = query.eq('collector_id', collector_id);

        const { data, error, count } = await query;
        if (error) throw error;

        res.json({ data, total: count, page: +page, limit: +limit });
    } catch (err) {
        next(err);
    }
});

// POST /api/donations/:id/void — Void a donation (president/cashier)
router.post('/:id/void', roleGuard(['president', 'cashier']), requireAppUser, async (req, res, next) => {
    try {
        const fallbackReason = req.userRole === 'cashier' ? 'Voided by cashier' : 'Voided by president';

        const { data, error } = await supabaseAdmin
            .rpc('void_donation', {
                p_club_id: req.clubId,
                p_donation_id: req.params.id,
                p_adjusted_by_user_id: req.appUserId,
                p_reason: req.body.reason || fallbackReason,
            });

        if (error) throw error;

        res.json({
            data: Array.isArray(data) ? data[0] : data,
            message: 'Donation voided successfully',
        });
    } catch (err) {
        next(err);
    }
});

export default router;
