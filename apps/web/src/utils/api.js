import { supabase } from '../config/supabase';

// In production (Vercel), API calls are proxied via vercel.json rewrite rules
// In development, fall back to localhost:3001 if vite proxy isn't available
const API_BASE = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? '' : 'http://localhost:3001');

/**
 * Wrapper around fetch that auto-injects the Supabase JWT.
 * Usage: const data = await apiFetch('/api/donations');
 */
export async function apiFetch(path, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE}${path}`;

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(body.error || `Request failed: ${res.status}`);
        err.status = res.status;
        err.body = body;
        throw err;
    }

    return res.json();
}
