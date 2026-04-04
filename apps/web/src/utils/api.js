import { supabase } from '../config/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

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

    const res = await fetch(`${API_BASE}${path}`, {
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
