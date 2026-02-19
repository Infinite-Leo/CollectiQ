import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

// GET /api/events — List events for current club
router.get('/', async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('club_id', req.clubId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        next(err);
    }
});

// POST /api/events — Create event
router.post('/', roleGuard(['president', 'secretary']), async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { name, type, start_date, end_date } = req.body;

        const { data, error } = await supabase
            .from('events')
            .insert({
                club_id: req.clubId,
                name,
                type,
                start_date,
                end_date,
                status: 'active',
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/events/:id — Update event
router.patch('/:id', roleGuard(['president', 'secretary']), async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { data, error } = await supabase
            .from('events')
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
