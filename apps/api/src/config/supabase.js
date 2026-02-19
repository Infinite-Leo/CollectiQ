import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — running in mock mode');
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
