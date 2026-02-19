import { Router } from 'express';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();
const isMock = process.env.NODE_ENV !== 'production';

// In-memory mock donor store for development
const mockDonors = [];

// GET /api/donors — Search donors by name or phone
router.get('/', async (req, res, next) => {
    try {
        const { query, limit = 10 } = req.query;

        if (isMock) {
            let results = mockDonors;
            if (query) {
                const q = query.toLowerCase();
                results = mockDonors.filter(d =>
                    d.full_name.toLowerCase().includes(q) ||
                    (d.phone && d.phone.includes(q))
                );
            }
            return res.json({ data: results.slice(0, limit) });
        }

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
router.post('/', roleGuard(['president', 'secretary', 'collector']), async (req, res, next) => {
    try {
        const { full_name, phone, house_id } = req.body;

        if (isMock) {
            const newDonor = {
                id: crypto.randomUUID(),
                club_id: req.clubId,
                full_name,
                phone: phone || null,
                house_id: house_id || null,
                created_at: new Date().toISOString(),
            };
            mockDonors.push(newDonor);
            return res.status(201).json({ data: newDonor });
        }

        // Use admin client to bypass RLS if JWT claims are missing
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

