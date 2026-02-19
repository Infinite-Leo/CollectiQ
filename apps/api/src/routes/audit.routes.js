import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

// GET /api/audit — Fetch audit logs (Paginated)
router.get('/', roleGuard(['president', 'secretary']), async (req, res, next) => {
    try {
        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        const { page = 1, limit = 50, table_name, action } = req.query;

        let query = supabase
            .from('audit_logs')
            .select('*, users(full_name, role)', { count: 'exact' })
            .eq('club_id', req.clubId)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (table_name) query = query.eq('table_name', table_name);
        if (action) query = query.eq('action', action);

        const { data, error, count } = await query;
        if (error) throw error;

        res.json({ data, total: count, page: +page, limit: +limit });
    } catch (err) {
        next(err);
    }
});

export default router;
