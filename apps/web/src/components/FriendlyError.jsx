import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function FriendlyError({
    actionName = 'save this record',
    reason = 'The system was unable to reach the server. Please check your internet connection.',
    onRetry,
    showDataSafeNote = true,
}) {
    return (
        <div
            role="alert"
            style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '16px 20px',
                color: '#FEE2E2',
                marginBottom: '16px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle size={22} style={{ color: '#F87171', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#FEF2F2', marginBottom: '4px' }}>
                        We couldn't {actionName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#FCA5A5', lineHeight: 1.5, marginBottom: '8px' }}>
                        {reason}
                    </div>

                    {showDataSafeNote && (
                        <div
                            style={{
                                fontSize: '0.85rem',
                                color: '#D1FAE5',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                display: 'inline-block',
                                marginBottom: '12px',
                            }}
                        >
                            ✓ Your entered information has not been lost.
                        </div>
                    )}

                    {onRetry && (
                        <div>
                            <button
                                type="button"
                                onClick={onRetry}
                                style={{
                                    minHeight: '40px',
                                    padding: '6px 16px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    color: '#FFFFFF',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <RefreshCw size={14} /> Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
