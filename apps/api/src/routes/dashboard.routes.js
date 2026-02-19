import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard/summary — KPI cards data
router.get('/summary', async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { event_id } = req.query;

        // Total collection
        const { data: totalData } = await supabase
            .rpc('dashboard_total_collection', {
                p_club_id: req.clubId,
                p_event_id: event_id,
            });

        // Today's collection
        const { data: todayData } = await supabase
            .rpc('dashboard_today_collection', {
                p_club_id: req.clubId,
                p_event_id: event_id,
            });

        // Pending houses
        const { data: houseStats } = await supabase
            .from('houses')
            .select('is_collected', { count: 'exact' })
            .eq('club_id', req.clubId)
            .eq('event_id', event_id);

        const totalHouses = houseStats?.length || 0;
        const collectedHouses = houseStats?.filter((h) => h.is_collected).length || 0;

        res.json({
            total_collection: totalData?.[0]?.total || 0,
            total_donations: totalData?.[0]?.count || 0,
            today_collection: todayData?.[0]?.total || 0,
            today_donations: todayData?.[0]?.count || 0,
            total_houses: totalHouses,
            collected_houses: collectedHouses,
            pending_houses: totalHouses - collectedHouses,
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/dashboard/collector-stats — Collector ranking
router.get('/collector-stats', async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { event_id } = req.query;

        const { data, error } = await supabase
            .rpc('dashboard_collector_ranking', {
                p_club_id: req.clubId,
                p_event_id: event_id,
            });

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        next(err);
    }
});

// GET /api/dashboard/payment-split — Cash/UPI/Bank breakdown
router.get('/payment-split', async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { event_id } = req.query;

        const { data, error } = await supabase
            .rpc('dashboard_payment_split', {
                p_club_id: req.clubId,
                p_event_id: event_id,
            });

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        next(err);
    }
});

// GET /api/dashboard/trend — Daily collection trend
router.get('/trend', async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { event_id, days = 7 } = req.query;

        const { data, error } = await supabase
            .rpc('dashboard_collection_trend', {
                p_club_id: req.clubId,
                p_event_id: event_id,
                p_days: +days,
            });

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        next(err);
    }
});

export default router;
