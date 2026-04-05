import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, LogIn, LogOut, UserPlus, XCircle, RefreshCw, Filter } from 'lucide-react';
import { apiFetch } from '../utils/api';

const EVENT_CONFIG = {
    login:         { label: 'Login',         icon: LogIn,    color: '#1E5C3A', bg: '#E8F5EE', border: 'rgba(30,92,58,0.15)' },
    signup:        { label: 'Signup',        icon: UserPlus, color: '#4A6FA5', bg: '#E8F0FA', border: 'rgba(74,111,165,0.15)' },
    logout:        { label: 'Logout',        icon: LogOut,   color: '#7A5A3A', bg: '#FFF8E1', border: 'rgba(122,90,58,0.15)' },
    login_failed:  { label: 'Failed Login',  icon: XCircle,  color: '#8B1A1A', bg: '#FDE8E8', border: 'rgba(139,26,26,0.15)' },
    signup_failed: { label: 'Failed Signup', icon: XCircle,  color: '#8B1A1A', bg: '#FDE8E8', border: 'rgba(139,26,26,0.15)' },
};

function getRelativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'Just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function parseBrowser(ua) {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    return 'Other';
}

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const typeParam = filter !== 'all' ? `&type=${filter}` : '';
            const { data } = await apiFetch(`/api/auth/logs?limit=100${typeParam}`);
            setLogs(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, [fetchLogs]);

    const filterOptions = [
        { value: 'all', label: 'All Events' },
        { value: 'login', label: 'Logins' },
        { value: 'signup', label: 'Signups' },
        { value: 'logout', label: 'Logouts' },
        { value: 'login_failed', label: 'Failed' },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Audit Log
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Track who is logging in and out of the system.
                    </p>
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={fetchLogs}
                    style={{ gap: '6px', height: '36px', fontSize: '0.8125rem' }}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {filterOptions.map(opt => (
                    <button
                        key={opt.value}
                        className={`btn ${filter === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilter(opt.value)}
                        style={{
                            height: '32px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0 14px',
                            borderRadius: 'var(--radius-full)',
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {error && (
                <div style={{
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-error-light)',
                    color: 'var(--color-error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Events list */}
            <div className="card">
                {loading ? (
                    <div style={{ padding: '20px' }}>
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={`audit-skeleton-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0' }}>
                                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-text" style={{ width: '160px', marginBottom: '6px' }} />
                                    <div className="skeleton skeleton-text" style={{ width: '220px', height: '12px' }} />
                                </div>
                                <div className="skeleton skeleton-text" style={{ width: '60px', height: '12px' }} />
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <LogIn size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>No auth events recorded yet</div>
                        <div style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                            Events will appear here as users log in and out.
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {logs.map((log, i) => {
                            const config = EVENT_CONFIG[log.type] || EVENT_CONFIG.login;
                            const Icon = config.icon;
                            return (
                                <div
                                    key={log.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 20px',
                                        borderBottom: i < logs.length - 1 ? '1px solid var(--border-light)' : 'none',
                                        transition: 'background 0.15s',
                                        animation: `fadeInUp 0.3s ease ${i * 0.03}s both`,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: config.bg,
                                        border: `1px solid ${config.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={16} color={config.color} />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                            <span style={{
                                                fontWeight: 600,
                                                fontSize: '0.8125rem',
                                                color: 'var(--text-primary)',
                                            }}>
                                                {log.full_name || log.email?.split('@')[0] || 'Unknown'}
                                            </span>
                                            <span style={{
                                                fontSize: '0.6875rem',
                                                fontWeight: 600,
                                                padding: '1px 8px',
                                                borderRadius: 'var(--radius-full)',
                                                background: config.bg,
                                                color: config.color,
                                                border: `1px solid ${config.border}`,
                                            }}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <span>{log.email}</span>
                                            <span style={{ opacity: 0.5 }}>•</span>
                                            <span>{parseBrowser(log.user_agent)}</span>
                                            {log.ip && log.ip !== '::1' && (
                                                <>
                                                    <span style={{ opacity: 0.5 }}>•</span>
                                                    <span>IP: {log.ip}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                            {getRelativeTime(log.created_at)}
                                        </div>
                                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
