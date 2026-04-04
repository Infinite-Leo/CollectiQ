import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// ── Persistent auth event logging (Supabase table) ──────────────
async function logAuthEvent(type, { email, fullName, ip, userAgent, userId }) {
    try {
        await supabaseAdmin.from('auth_events').insert({
            type,
            email,
            full_name: fullName || null,
            user_id: userId || null,
            ip: ip || null,
            user_agent: userAgent || null,
        });
    } catch (err) {
        console.error('Failed to log auth event:', err.message);
    }
}

// GET /api/auth/logs — Fetch auth event history from Supabase
router.get('/logs', async (req, res, next) => {
    try {
        const { page = 1, limit = 50, type } = req.query;
        const from = (page - 1) * limit;
        const to = from + (+limit) - 1;

        let query = supabaseAdmin
            .from('auth_events')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (type) query = query.eq('type', type);

        const { data, error, count } = await query;
        if (error) throw error;

        res.json({ data, total: count, page: +page, limit: +limit });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/signup — Create a new user
router.post('/signup', async (req, res, next) => {
    try {
        const { email, password, full_name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for now
            user_metadata: { full_name: full_name || '' },
        });

        if (error) {
            logAuthEvent('signup_failed', {
                email,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            return res.status(400).json({ error: error.message });
        }

        // Sign the user in immediately after signup
        const { data: session, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });

        if (loginError) {
            return res.status(400).json({ error: loginError.message });
        }

        logAuthEvent('signup', {
            email,
            fullName: full_name,
            userId: data.user.id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.status(201).json({
            user: {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name,
            },
            session: session.session,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login — Sign in with email + password
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            logAuthEvent('login_failed', {
                email,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            return res.status(401).json({ error: error.message });
        }

        logAuthEvent('login', {
            email,
            fullName: data.user.user_metadata?.full_name,
            userId: data.user.id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name,
            },
            session: data.session,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/logout — Sign out (invalidate refresh token server-side)
router.post('/logout', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let email = 'unknown';
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) {
                email = user.email;
                await supabaseAdmin.auth.admin.signOut(user.id);
                logAuthEvent('logout', {
                    email: user.email,
                    fullName: user.user_metadata?.full_name,
                    userId: user.id,
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                });
            }
        }

        res.json({ message: 'Signed out successfully' });
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/me — Get current user from JWT
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name,
                role: user.app_metadata?.role || 'member',
                club_id: user.app_metadata?.club_id,
            },
        });
    } catch (err) {
        next(err);
    }
});

export default router;
