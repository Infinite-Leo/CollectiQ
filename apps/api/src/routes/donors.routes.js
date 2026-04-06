import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

// GET /api/donors — Search donors by name or phone
router.get('/', async (req, res, next) => {
    try {
        const { query, limit = 50 } = req.query;

        let dbQuery = supabaseAdmin
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

// POST /api/donors — Create a new donor (or return existing if duplicate)
router.post('/', roleGuard(['president', 'secretary', 'collector', 'owner']), async (req, res, next) => {
    try {
        const { full_name, phone, house_id } = req.body;

        const { data, error } = await supabaseAdmin
            .from('donors')
            .insert({
                club_id: req.clubId,
                full_name,
                phone: phone || null,
                house_id,
            })
            .select()
            .single();

        if (error) {
            // Handle duplicate donor (unique constraint on club_id + phone)
            if (error.code === '23505' && phone) {
                const { data: existing, error: lookupErr } = await supabaseAdmin
                    .from('donors')
                    .select('*')
                    .eq('club_id', req.clubId)
                    .eq('phone', phone)
                    .single();

                if (lookupErr) throw lookupErr;
                return res.status(200).json({ data: existing, existing: true });
            }
            // If no phone or different constraint, try lookup by name
            if (error.code === '23505') {
                const { data: existing, error: lookupErr } = await supabaseAdmin
                    .from('donors')
                    .select('*')
                    .eq('club_id', req.clubId)
                    .eq('full_name', full_name)
                    .limit(1)
                    .single();

                if (!lookupErr && existing) {
                    return res.status(200).json({ data: existing, existing: true });
                }
            }
            throw error;
        }

        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
});

export default router;
