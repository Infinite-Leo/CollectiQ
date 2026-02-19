import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

// GET /api/fraud — List fraud flags
router.get('/', roleGuard(['president', 'cashier']), async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { status, severity } = req.query;

        let query = supabase
            .from('fraud_flags')
            .select('*, donations(receipt_number, amount), users!flagged_user_id(full_name)')
            .eq('club_id', req.clubId)
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (severity) query = query.eq('severity', severity);

        const { data, error } = await query;
        if (error) throw error;

        res.json({ data });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/fraud/:id — Resolve/dismiss a flag (president only)
router.patch('/:id', roleGuard(['president']), async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { status, resolution_notes } = req.body;

        const { data, error } = await supabase
            .from('fraud_flags')
            .update({
                status,
                resolution_notes,
                resolved_by: req.user.id,
                resolved_at: new Date().toISOString(),
            })
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
