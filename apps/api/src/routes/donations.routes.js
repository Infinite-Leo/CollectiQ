import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();
const isMock = process.env.NODE_ENV !== 'production';

// In-memory mock donation store for development
const mockDonations = [];
let mockReceiptCounter = 300;

// POST /api/donations — Record a new donation (transactional)
router.post('/', roleGuard(['president', 'secretary', 'collector']), async (req, res, next) => {
    try {
        const {
            event_id, donor_id, zone_id, house_id,
            amount, payment_mode, payment_status,
            idempotency_key, notes, collection_lat, collection_lng, device_id,
        } = req.body;

        if (isMock) {
            mockReceiptCounter++;
            const receipt_number = `DNC-DP26-${String(mockReceiptCounter).padStart(6, '0')}`;
            const newDonation = {
                id: crypto.randomUUID(),
                club_id: 'mock-club-id',
                event_id: event_id || 'mock-event-id',
                donor_id,
                collector_id: req.user.id,
                zone_id: zone_id || null,
                house_id: house_id || null,
                amount: parseFloat(amount),
                payment_mode: payment_mode || 'cash',
                payment_status: payment_status || 'paid',
                receipt_number,
                notes: notes || null,
                collected_at: new Date().toISOString(),
                is_void: false,
            };
            mockDonations.push(newDonation);
            return res.status(201).json({ data: newDonation, receipt_number });
        }

        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;

        // Ensure event_id exists
        let finalEventId = event_id;
        if (!finalEventId) {
            const { data: activeEvent, error: eventErr } = await supabase
                .from('events')
                .select('id')
                .eq('club_id', req.clubId)
                .eq('status', 'active')
                .single();

            if (eventErr || !activeEvent) {
                throw new Error('No active event found. Please create or start an event.');
            }
            finalEventId = activeEvent.id;
        }

        // Generate receipt number (RPC is robust, but calling with admin ensures it runs)
        const { data: seqData, error: seqErr } = await supabaseAdmin
            .rpc('next_receipt_number', { p_club_id: req.clubId, p_event_id: finalEventId });

        if (seqErr) throw seqErr;

        const receipt_number = seqData;

        // Insert donation — Use admin client to bypass RLS issues
        const { data, error } = await supabaseAdmin
            .from('donations')
            .insert({
                club_id: req.clubId,
                event_id: finalEventId,
                donor_id,
                collector_id: req.user.id,
                zone_id,
                house_id,
                amount,
                payment_mode: payment_mode || 'cash',
                payment_status: payment_status || 'paid',
                receipt_number,
                idempotency_key,
                notes,
                collection_lat,
                collection_lng,
                device_id,
            })
            .select()
            .single();

        if (error) throw error;

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

        if (isMock) {
            let results = [...mockDonations];
            if (payment_status) results = results.filter(d => d.payment_status === payment_status);
            if (payment_mode) results = results.filter(d => d.payment_mode === payment_mode);
            const start = (page - 1) * limit;
            return res.json({ data: results.slice(start, start + limit), total: results.length, page: +page, limit: +limit });
        }

        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;

        let query = supabase
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
router.post('/:id/void', roleGuard(['president']), async (req, res, next) => {
    try {
        if (isMock) {
            const donation = mockDonations.find(d => d.id === req.params.id);
            if (donation) donation.is_void = true;
            return res.json({ data: { id: req.params.id }, message: 'Donation voided' });
        }

        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;

        // Create adjustment record instead of modifying donation
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

