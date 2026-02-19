import { supabaseAdmin } from '../config/supabase.js';

/**
 * Auth middleware — verifies Supabase JWT and attaches user context.
 * Sets req.user = { id, email, app_metadata: { club_id, role } }
 */
export async function auth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        // Development bypass — if no token provided and not in production, use mock user
        if (!authHeader?.startsWith('Bearer ') && process.env.NODE_ENV !== 'production') {
            // Fixed UUID matching seed.js DEV_CLUB_ID
            const devClubId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            req.user = {
                id: 'dev-user-id',
                email: 'president@durganagar.com',
                app_metadata: { club_id: devClubId, role: 'president' },
            };
            req.clubId = devClubId;
            req.userRole = 'president';
            req.accessToken = null;
            return next();
        }

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user context for downstream use
        req.user = user;
        req.clubId = user.app_metadata?.club_id;
        req.userRole = user.app_metadata?.role;
        req.accessToken = token;

        next();
    } catch (err) {
        next(err);
    }
}

/**
 * Role guard factory — restricts routes by role.
 * Usage: router.post('/...', roleGuard(['president', 'secretary']), handler)
 */
export function roleGuard(allowedRoles) {
    return (req, res, next) => {
        if (!req.userRole || !allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.userRole || 'none',
            });
        }
        next();
    };
}
