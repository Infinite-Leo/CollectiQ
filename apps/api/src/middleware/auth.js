import { supabaseAdmin } from '../config/supabase.js';
import { normalizeRole, resolveUserContext } from '../services/userContext.js';

/**
 * Auth middleware — verifies Supabase JWT and attaches user context.
 * Sets req.user = { id, email, app_metadata: { club_id, role } }
 */
export async function auth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

        // Helper to attach mock dev user context
        function attachDevUser(reason) {
            const devUserId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
            const devClubId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            console.log(`ℹ️  Development mode: Using mock user (${reason})`);
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

        // Development bypass — no token provided
        if (!authHeader?.startsWith('Bearer ') && isDevelopment) {
            return attachDevUser('no token provided');
        }

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            // In development, fall back to mock user if token is stale/expired
            if (isDevelopment) {
                return attachDevUser('token invalid/expired — falling back');
            }
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const context = await resolveUserContext(user, { autoAssignIfSingleClub: true });

        // Attach user context for downstream use
        req.user = context.authUser;
        req.authUser = context.authUser;
        req.userRole = normalizeRole(context.userRole);
        req.clubId = context.clubId;
        req.accessToken = token;
        req.appUser = context.appUser || null;
        req.appUserId = context.appUserId || null;

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
