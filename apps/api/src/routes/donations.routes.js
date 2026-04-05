import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';
import { PAYMENT_MODES, PAYMENT_STATUSES } from '../constants/paymentModes.js';

const router = Router();

// POST /api/donations — Record a new donation (transactional)
router.post('/', roleGuard(['president', 'secretary', 'collector', 'owner']), async (req, res, next) => {
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

        // Generate receipt number
        const { data: seqData, error: seqErr } = await supabaseAdmin
            .rpc('next_receipt_number', { p_club_id: req.clubId, p_event_id: finalEventId });

        if (seqErr) {
            console.error('Receipt number generation error:', seqErr);
            throw seqErr;
        }

        const receipt_number = seqData;

        // Insert donation
        const { data, error } = await supabaseAdmin
            .from('donations')
            .insert({
                club_id: req.clubId,
                event_id: finalEventId,
                donor_id,
                collector_id: req.user.id,
                zone_id: zone_id || null,
                house_id: house_id || null,
                amount,
                payment_mode: payment_mode || PAYMENT_MODES.CASH,
                payment_status: payment_status || PAYMENT_STATUSES.PAID,
                receipt_number,
                idempotency_key: idempotency_key || null,
                notes: notes || null,
                collection_lat: collection_lat || null,
                collection_lng: collection_lng || null,
                device_id: device_id || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Donation insert error:', error);
            throw error;
        }

        // Mark house as collected if applicable
        if (house_id) {
            await supabaseAdmin
                .from('houses')
                .update({ is_collected: true })
                .eq('id', house_id)
                .eq('club_id', req.clubId);
        }

        res.status(201).json({ data, receipt_number });
    } catch (err) {
        next(err);
    }
});

// GET /api/donations — List donations (paginated, filtered)
router.get('/', async (req, res, next) => {
    try {
        const { event_id, payment_status, payment_mode, collector_id, page = 1, limit = 50 } = req.query;

        // Use admin client to bypass RLS — auth is already enforced by middleware
        let query = supabaseAdmin
            .from('donations')
            .select('*, donors(full_name), users!collector_id(full_name)', { count: 'exact' })
            .eq('club_id', req.clubId)
            .eq('is_void', false)
            .order('collected_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

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

// POST /api/donations/:id/void — Void a donation (president only)
router.post('/:id/void', roleGuard(['president', 'owner']), async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;

        const { data, error } = await supabase
            .from('donation_adjustments')
            .insert({
                club_id: req.clubId,
                donation_id: req.params.id,
                adjusted_by: req.user.id,
                adjustment_type: 'void',
                reason: req.body.reason || 'Voided by president',
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ data, message: 'Donation voided via adjustment record' });
    } catch (err) {
        next(err);
    }
});

export default router;
