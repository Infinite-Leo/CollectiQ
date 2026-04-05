import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// In production, fail hard if credentials are missing
if (process.env.NODE_ENV === 'production') {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('🚨 FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in production!');
        console.error('Please set these environment variables in Railway dashboard.');
        process.exit(1);
    }
} else {
    // In development, warn but allow fallback
    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('⚠️  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — using local fallback (mocking disabled)');
    }
}

/**
 * Admin client — bypasses RLS. Use only in server-side functions
 * where RLS scoping is handled manually.
 */
export const supabaseAdmin = createClient(
    supabaseUrl || 'http://localhost:54321',
    supabaseServiceKey || 'mock-service-key',
    { auth: { persistSession: false } }
);

/**
 * Creates a per-request Supabase client scoped to the user's JWT.
 * RLS policies apply automatically.
 */
export function createUserClient(accessToken) {
    return createClient(
        supabaseUrl || 'http://localhost:54321',
        process.env.SUPABASE_ANON_KEY || 'mock-anon-key',
        {
            global: {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
            auth: { persistSession: false },
        }
    );
}
