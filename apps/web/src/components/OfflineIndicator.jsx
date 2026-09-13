import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showSyncedToast, setShowSyncedToast] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowSyncedToast(true);
            const timer = setTimeout(() => setShowSyncedToast(false), 4000);
            return () => clearTimeout(timer);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowSyncedToast(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (showSyncedToast) {
        return (
            <div
                role="status"
                style={{
                    backgroundColor: '#065F46',
                    color: '#ECFDF5',
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 9999,
                    transition: 'all 0.3s ease',
                }}
            >
                <CheckCircle2 size={18} />
                <span>You are back online — all pending records are synchronized.</span>
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div
                role="alert"
                style={{
                    backgroundColor: '#92400E',
                    color: '#FEF3C7',
                    padding: '10px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 9999,
                }}
            >
                <WifiOff size={18} />
                <span>
                    Offline Mode Active — You can continue recording collections. Data is saved locally and will sync when internet returns.
                </span>
            </div>
        );
    }

    return null;
}
