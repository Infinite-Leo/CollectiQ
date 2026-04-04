import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

// GET /api/donors — Search donors by name or phone
router.get('/', async (req, res, next) => {
    try {
        const { query, limit = 50 } = req.query;

        const supabase = req.accessToken ? createUserClient(req.accessToken) : supabaseAdmin;
        let dbQuery = supabase
            .from('donors')
            .select('*')
            .eq('club_id', req.clubId)
            .limit(limit);

        if (query) {
            dbQuery = dbQuery.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`);
        }

        const { data, error } = await dbQuery;
        if (error) throw error;

        res.json({ data });
    } catch (err) {
        next(err);
    }
});

// POST /api/donors — Create a new donor
router.post('/', roleGuard(['president', 'secretary', 'collector', 'owner']), async (req, res, next) => {
    try {
        const { full_name, phone, house_id } = req.body;

        const { data, error } = await supabaseAdmin
            .from('donors')
            .insert({
                club_id: req.clubId,
                full_name,
                phone,
                house_id,
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
});

export default router;
