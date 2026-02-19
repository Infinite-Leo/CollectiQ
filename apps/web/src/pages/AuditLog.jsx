import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/audit?page=${page}`);
            if (!res.ok) {
                if (res.status === 403) throw new Error('Access denied. President/Secretary only.');
                throw new Error('Failed to fetch logs');
            }
            const { data, total, limit } = await res.json();
            setLogs(data);
            setTotalPages(Math.ceil(total / limit));
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-body">
            <div className="card-header" style={{ border: 'none', padding: '0 0 var(--space-6) 0', background: 'transparent' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Audit Log</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Track system activities and changes.
                    </p>
                </div>
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
                    gap: 'var(--space-2)'
                }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <Loader2 size={24} className="animate-spin" />
                                            <span>Loading logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No activity recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.users?.full_name || 'System'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.users?.role}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${log.action === 'INSERT' ? 'badge-active' :
                                                log.action === 'DELETE' ? 'badge-closed' : 'badge-draft'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {log.table_name}
                                        </td>
                                        <td style={{ maxWidth: '300px', fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {JSON.stringify(log.new_data || log.old_data)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && logs.length > 0 && (
                    <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="btn btn-secondary"
                            style={{ height: '32px', fontSize: '0.75rem' }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="btn btn-secondary"
                            style={{ height: '32px', fontSize: '0.75rem' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
