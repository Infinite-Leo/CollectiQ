import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize — check for existing session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, s) => {
                setSession(s);
                setUser(s?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = useCallback(async (email, password) => {
        // Route through backend API so login gets logged in audit trail
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const body = await res.json();

        if (!res.ok) {
            throw new Error(body.error || 'Invalid email or password');
        }

        // Set the session on the Supabase client so onAuthStateChange fires
        if (body.session) {
            await supabase.auth.setSession({
                access_token: body.session.access_token,
                refresh_token: body.session.refresh_token,
            });
        }

        return body;
    }, []);

    const signup = useCallback(async (email, password, fullName) => {
        // Route through backend API — uses admin.createUser with email_confirm: true
        // so the user is auto-confirmed and can log in immediately
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: fullName }),
        });

        const body = await res.json();

        if (!res.ok) {
            throw new Error(body.error || 'Signup failed');
        }

        // The backend returns a session — set it on the Supabase client
        // so onAuthStateChange fires and the UI updates
        if (body.session) {
            await supabase.auth.setSession({
                access_token: body.session.access_token,
                refresh_token: body.session.refresh_token,
            });
        }

        return body;
    }, []);

    const logout = useCallback(async () => {
        // Notify backend for audit logging before signing out
        try {
            const token = session?.access_token;
            if (token) {
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch {
            // Don't block logout if backend notification fails
        }
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }, [session]);

    const getAccessToken = useCallback(async () => {
        const { data: { session: s } } = await supabase.auth.getSession();
        return s?.access_token ?? null;
    }, []);

    const value = {
        user,
        session,
        loading,
        login,
        signup,
        logout,
        getAccessToken,
        isAuthenticated: !!session,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
