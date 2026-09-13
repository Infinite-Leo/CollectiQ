import React from 'react';
import { AlertTriangle, UserCheck, UserPlus, X } from 'lucide-react';

export default function DuplicateDetectModal({
    isOpen,
    onClose,
    existingDonor,
    onSelectExisting,
    onCreateNew,
}) {
    if (!isOpen || !existingDonor) return null;

    const donor = existingDonor.donor || existingDonor;

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
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '16px',
                    maxWidth: '460px',
                    width: '100%',
                    padding: '28px',
                    color: '#F3F4F6',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#F59E0B',
                        }}
                    >
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#FDFBF7' }}>
                            Possible Existing Donor Found
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
                            We found an existing member with similar details
                        </span>
                    </div>
                </div>

                {/* Match Details */}
                <div
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px',
                    }}
                >
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#D4AF37', marginBottom: '6px' }}>
                        {donor.full_name}
                    </div>
                    {donor.phone && (
                        <div style={{ fontSize: '0.9rem', color: '#D1D5DB', marginBottom: '4px' }}>
                            📱 Mobile: {donor.phone}
                        </div>
                    )}
                    {donor.houses?.address_line && (
                        <div style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
                            🏠 Address: {donor.houses.address_line} {donor.houses.landmark ? `(${donor.houses.landmark})` : ''}
                        </div>
                    )}
                    {(existingDonor.match_type === 'PHONETIC_MATCH' || existingDonor.match_type === 'EXACT_OR_ALIAS_MATCH') && (
                        <div style={{ marginTop: '8px' }}>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                    color: '#C4B5FD',
                                    border: '1px solid rgba(139, 92, 246, 0.4)',
                                }}
                            >
                                🤖 AI Phonetic Match ({Math.round((existingDonor.confidence || 0.9) * 100)}%)
                            </span>
                        </div>
                    )}
                    {existingDonor.reason && (
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#FBBF24', fontStyle: 'italic' }}>
                            Notice: {existingDonor.reason}
                        </div>
                    )}
                </div>

                <p style={{ fontSize: '0.875rem', color: '#D1D5DB', lineHeight: 1.5, marginBottom: '24px' }}>
                    Would you like to record this collection under this existing donor, or create a brand new donor entry?
                </p>

                {/* Action Buttons - Large Touch Targets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => onSelectExisting(donor)}
                        style={{
                            minHeight: '48px',
                            backgroundColor: '#D4AF37',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#111827',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        <UserCheck size={18} /> Use Existing Donor
                    </button>

                    <button
                        type="button"
                        onClick={onCreateNew}
                        style={{
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
                        <UserPlus size={18} /> Create as New Donor
                    </button>
                </div>
            </div>
        </div>
    );
}
