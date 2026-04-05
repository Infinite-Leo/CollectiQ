import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// GET /api/collectors — List collectors for the current club
router.get('/', async (req, res, next) => {
    try {
        if (!req.clubId) {
            return res.status(400).json({ error: 'Missing club context' });
        }

        const { data: role, error: roleErr } = await supabaseAdmin
            .from('roles')
            .select('id')
            .eq('name', 'collector')
            .single();

        let collectors = [];

        if (!roleErr && role) {
            const { data, error } = await supabaseAdmin
                .from('club_members')
                .select('id, joined_at, users(id, full_name, phone, is_active)')
                .eq('club_id', req.clubId)
                .eq('role_id', role.id);

            if (error) throw error;

            collectors = (data || []).map((member) => {
                const user = member.users || {};
                const joinedAt = member.joined_at ? new Date(member.joined_at) : null;
                return {
                    id: user.id || member.id,
                    name: user.full_name || 'Unknown',
                    phone: user.phone || '-',
                    status: user.is_active ? 'active' : 'inactive',
                    since: joinedAt ? joinedAt.getFullYear().toString() : '-',
                    zone: 'Unassigned',
                };
            });
        }

        if (collectors.length === 0) {
            const { data: donationCollectors, error: donationErr } = await supabaseAdmin
                .from('donations')
                .select('collector_id, users!collector_id(id, full_name, phone, is_active)')
                .eq('club_id', req.clubId)
                .not('collector_id', 'is', null)
                .limit(100);

            if (donationErr) throw donationErr;

            const map = new Map();
            (donationCollectors || []).forEach((row) => {
                const user = row.users || {};
                if (user.id && !map.has(user.id)) {
                    map.set(user.id, {
                        id: user.id,
                        name: user.full_name || 'Unknown',
                        phone: user.phone || '-',
                        status: user.is_active ? 'active' : 'inactive',
                        since: '-',
                        zone: 'Unassigned',
                    });
                }
            });
            collectors = Array.from(map.values());
        }

        res.json({ data: collectors });
    } catch (err) {
        next(err);
    }
});

export default router;
