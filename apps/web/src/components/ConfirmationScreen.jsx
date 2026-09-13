import React from 'react';
import { Check, Edit2, ShieldCheck } from 'lucide-react';

export default function ConfirmationScreen({
    isOpen,
    title = 'Confirm Collection',
    donorName = '',
    amount = 0,
    paymentMode = 'CASH',
    paymentStatus = 'PAID',
    collectorName = '',
    notes = '',
    onConfirm,
    onEdit,
    isSubmitting = false,
}) {
    if (!isOpen) return null;

    const formattedAmount = Number(amount || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
    });

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px',
            }}
        >
            <div
                style={{
                    backgroundColor: '#1E1B18',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '16px',
                    maxWidth: '480px',
                    width: '100%',
                    padding: '28px',
                    color: '#F3F4F6',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(212, 175, 55, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#D4AF37',
                        }}
                    >
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#FDFBF7' }}>
                            {title}
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
                            Please verify the details before saving to the register
                        </span>
                    </div>
                </div>

                {/* Amount Highlight - Numbers First! */}
                <div
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <div style={{ fontSize: '0.85rem', color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Total Contribution
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#D4AF37' }}>
                        ₹ {formattedAmount}
                    </div>
                </div>

                {/* Ledger Details */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        fontSize: '0.95rem',
                        marginBottom: '24px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                        <span style={{ color: '#9CA3AF' }}>Donor:</span>
                        <strong style={{ color: '#F3F4F6' }}>{donorName || 'Not specified'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                        <span style={{ color: '#9CA3AF' }}>Payment Mode:</span>
                        <span
                            style={{
                                padding: '2px 10px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: paymentMode === 'UPI' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: paymentMode === 'UPI' ? '#60A5FA' : '#34D399',
                            }}
                        >
                            {paymentMode}
                        </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                        <span style={{ color: '#9CA3AF' }}>Payment Status:</span>
                        <span
                            style={{
                                padding: '2px 10px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: paymentStatus === 'PAID' ? '#34D399' : '#FBBF24',
                            }}
                        >
                            {paymentStatus}
                        </span>
                    </div>

                    {collectorName && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                            <span style={{ color: '#9CA3AF' }}>Collector:</span>
                            <span style={{ color: '#F3F4F6' }}>{collectorName}</span>
                        </div>
                    )}

                    {notes && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                            <span style={{ color: '#9CA3AF' }}>Notes:</span>
                            <span style={{ color: '#D1D5DB', maxWidth: '60%', textAlign: 'right' }}>{notes}</span>
                        </div>
                    )}
                </div>

                {/* Friendly Assurance */}
                <div
                    style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.825rem',
                        color: '#A7F3D0',
                        marginBottom: '24px',
                    }}
                >
                    ✓ Saving will generate an official digital receipt that you can print or send on WhatsApp.
                </div>

                {/* Actions - Big touch targets! */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={onEdit}
                        disabled={isSubmitting}
                        style={{
                            flex: 1,
                            minHeight: '48px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            color: '#D1D5DB',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        <Edit2 size={16} /> Edit
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        style={{
                            flex: 2,
                            minHeight: '48px',
                            backgroundColor: '#D4AF37',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#111827',
                            fontSize: '1rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                        }}
                    >
                        <Check size={18} /> {isSubmitting ? 'Recording...' : 'Confirm & Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
