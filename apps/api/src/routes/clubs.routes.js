import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

// GET /api/clubs — Get current user's club
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('clubs')
            .select('*')
            .eq('id', req.clubId)
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/clubs — Update club settings (president only)
router.patch('/', roleGuard(['president']), async (req, res, next) => {
    try {
        const { name, address, phone, email, logo_url } = req.body;

        const { data, error } = await supabaseAdmin
            .from('clubs')
            .update({ name, address, phone, email, logo_url })
            .eq('id', req.clubId)
            .select()
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (err) {
        next(err);
    }
});

export default router;
