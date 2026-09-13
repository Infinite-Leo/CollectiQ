import React from 'react';
import { Printer, Share2, Check, X, ShieldCheck } from 'lucide-react';

export default function ReceiptModal({
    isOpen,
    onClose,
    receiptNumber = 'DP26-000184',
    donorName = 'Valued Contributor',
    donorPhone = '',
    amount = 1000,
    paymentMode = 'CASH',
    paymentStatus = 'PAID',
    collectorName = 'Sayan Das',
    date = new Date().toLocaleString('en-IN'),
    campaignName = 'Durga Puja 2026',
    clubName = 'Salt Lake Community Club',
}) {
    if (!isOpen) return null;

    const formattedAmount = Number(amount || 0).toLocaleString('en-IN');

    // Handle WhatsApp Share
    const handleWhatsAppShare = () => {
        const text = encodeURIComponent(
            `🧾 *CollectiQ Digital Receipt*\n` +
            `*${clubName} — ${campaignName}*\n\n` +
            `Receipt No: *${receiptNumber}*\n` +
            `Donor: ${donorName}\n` +
            `Amount: *₹${formattedAmount}*\n` +
            `Payment: ${paymentMode} (${paymentStatus})\n` +
            `Date: ${date}\n` +
            `Collected By: ${collectorName}\n\n` +
            `Thank you for your valuable contribution to the community festival!`
        );
        const url = donorPhone
            ? `https://wa.me/91${donorPhone.replace(/[^0-9]/g, '').slice(-10)}?text=${text}`
            : `https://wa.me/?text=${text}`;
        window.open(url, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

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
                className="receipt-modal-container"
                style={{
                    backgroundColor: '#FFFFFF',
                    color: '#111827',
                    borderRadius: '16px',
                    maxWidth: '460px',
                    width: '100%',
                    padding: '28px',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
                    position: 'relative',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    type="button"
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                    }}
                >
                    <X size={20} />
                </button>

                {/* Receipt Printable Area */}
                <div id="printable-receipt" style={{ padding: '8px 4px' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px dashed #E5E7EB', paddingBottom: '16px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#6B7280', textTransform: 'uppercase' }}>
                            Official Donation Receipt
                        </div>
                        <h2 style={{ margin: '4px 0', fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>
                            {clubName}
                        </h2>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#B45309' }}>
                            {campaignName}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem', color: '#4B5563' }}>
                        <div>
                            <span>Receipt: </span>
                            <strong style={{ color: '#111827', fontFamily: 'monospace', fontSize: '0.95rem' }}>{receiptNumber}</strong>
                        </div>
                        <div>
                            <span>{date}</span>
                        </div>
                    </div>

                    {/* Amount Box */}
                    <div
                        style={{
                            backgroundColor: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                            Amount Received
                        </span>
                        <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>
                            ₹ {formattedAmount}
                        </div>
                    </div>

                    {/* Ledger Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Received From:</span>
                            <strong style={{ color: '#111827' }}>{donorName}</strong>
                        </div>
                        {donorPhone && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '6px' }}>
                                <span style={{ color: '#6B7280' }}>Mobile:</span>
                                <span style={{ color: '#111827' }}>{donorPhone}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Payment Mode:</span>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{paymentMode}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Status:</span>
                            <span style={{ fontWeight: 700, color: paymentStatus === 'PAID' ? '#047857' : '#D97706' }}>
                                {paymentStatus}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                            <span style={{ color: '#6B7280' }}>Collector / Cashier:</span>
                            <span style={{ color: '#111827' }}>{collectorName}</span>
                        </div>
                    </div>

                    <div style={{ borderTop: '2px dashed #E5E7EB', paddingTop: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#6B7280' }}>
                        Digitally recorded in CollectiQ • Authenticated community register entry
                    </div>
                </div>

                {/* Actions - No print styles for buttons */}
                <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleWhatsAppShare}
                            type="button"
                            style={{
                                flex: 1,
                                minHeight: '46px',
                                backgroundColor: '#25D366',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#FFFFFF',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            <Share2 size={18} /> WhatsApp
                        </button>

                        <button
                            onClick={handlePrint}
                            type="button"
                            style={{
                                flex: 1,
                                minHeight: '46px',
                                backgroundColor: '#111827',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#FFFFFF',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            <Printer size={18} /> Print
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        type="button"
                        style={{
                            minHeight: '44px',
                            backgroundColor: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            borderRadius: '10px',
                            color: '#374151',
                            fontSize: '0.925rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
