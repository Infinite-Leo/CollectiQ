import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

// GET /api/houses — List houses (with pagination + bbox filter for maps)
router.get('/', async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { event_id, zone_id, is_collected, priority, page = 1, limit = 100 } = req.query;

        let query = supabase
            .from('houses')
            .select('*, zones(name)', { count: 'exact' })
            .eq('club_id', req.clubId)
            .order('priority', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (event_id) query = query.eq('event_id', event_id);
        if (zone_id) query = query.eq('zone_id', zone_id);
        if (is_collected !== undefined) query = query.eq('is_collected', is_collected === 'true');
        if (priority) query = query.eq('priority', priority);

        const { data, error, count } = await query;
        if (error) throw error;

        res.json({ data, total: count, page: +page, limit: +limit });
    } catch (err) {
        next(err);
    }
});

// POST /api/houses — Add a single house
router.post('/', roleGuard(['president', 'secretary', 'collector']), async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { data, error } = await supabase
            .from('houses')
            .insert({ ...req.body, club_id: req.clubId })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
});

// POST /api/houses/bulk — Bulk import from CSV
router.post('/bulk', roleGuard(['president', 'secretary']), async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { houses } = req.body; // Array of house objects

        const withClub = houses.map((h) => ({ ...h, club_id: req.clubId }));
        const { data, error } = await supabase
            .from('houses')
            .insert(withClub)
            .select();

        if (error) throw error;
        res.status(201).json({ data, imported: data.length });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/houses/:id — Update house
router.patch('/:id', roleGuard(['president', 'secretary']), async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { data, error } = await supabase
            .from('houses')
            .update(req.body)
            .eq('id', req.params.id)
            .eq('club_id', req.clubId)
            .select()
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        next(err);
    }
});

export default router;
