import { supabaseAdmin } from '../config/supabase.js';

const LEGACY_ROLE_MAP = {
    owner: 'president',
    admin: 'secretary',
    viewer: 'cashier',
};

function normalizeRole(role) {
    return LEGACY_ROLE_MAP[role] || role || null;
}

/**
 * Auth middleware — verifies Supabase JWT and attaches user context.
 * Sets req.user = { id, email, app_metadata: { club_id, role } }
 */
export async function auth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        // Development bypass — if no token provided and running locally, use mock user
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
        if (!authHeader?.startsWith('Bearer ') && isDevelopment) {
            const devUserId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
            // Fixed UUID matching seed.js DEV_CLUB_ID
            const devClubId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            console.log('ℹ️  Development mode: Using mock user (no token provided)');
            req.user = {
                id: devUserId,
                email: 'president@durganagar.com',
                app_metadata: { club_id: devClubId, role: 'president' },
            };
            req.authUser = req.user;
            req.appUser = {
                id: devUserId,
                full_name: 'Dev President',
                email: 'president@durganagar.com',
                is_active: true,
            };
            req.appUserId = devUserId;
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
        req.authUser = user;
        req.userRole = normalizeRole(user.app_metadata?.role);
        req.clubId = user.app_metadata?.club_id;
        req.accessToken = token;

        const { data: appUser, error: appUserErr } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email, phone, is_active')
            .eq('auth_uid', user.id)
            .maybeSingle();

        if (appUserErr) {
            return next(appUserErr);
        }

        req.appUser = appUser || null;
        req.appUserId = appUser?.id || null;

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

export function requireAppUser(req, res, next) {
    if (!req.appUserId) {
        return res.status(403).json({
            error: 'User profile is not provisioned for this account yet',
        });
    }

    next();
}
