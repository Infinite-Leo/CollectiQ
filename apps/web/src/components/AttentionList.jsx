import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AttentionList({
    pendingCount = 12,
    pendingAmount = 38500,
    unreconciledHandovers = 2,
    campaignProgressPercent = 74,
    campaignName = 'Durga Puja 2026',
}) {
    const items = [
        {
            id: 'pending',
            severity: 'critical',
            badgeColor: '#B91C1C',
            bg: 'rgba(185, 28, 28, 0.08)',
            border: 'rgba(185, 28, 28, 0.25)',
            icon: AlertCircle,
            title: `${pendingCount} Pending Collections`,
            description: `₹${pendingAmount.toLocaleString('en-IN')} is currently unpaid or partially pledged across active households.`,
            actionLabel: 'Review Pending',
            link: '/donations?status=PENDING',
        },
        {
            id: 'handover',
            severity: 'warning',
            badgeColor: '#D97706',
            bg: 'rgba(217, 119, 6, 0.08)',
            border: 'rgba(217, 119, 6, 0.25)',
            icon: Clock,
            title: `${unreconciledHandovers} Cash Handovers Awaiting Verification`,
            description: 'Collectors have submitted physical cash requiring cashier count & verification in the digital ledger.',
            actionLabel: 'Reconcile Cash',
            link: '/finance',
        },
        {
            id: 'progress',
            severity: 'success',
            badgeColor: '#059669',
            bg: 'rgba(5, 150, 105, 0.08)',
            border: 'rgba(5, 150, 105, 0.25)',
            icon: CheckCircle2,
            title: `${campaignName} is ${campaignProgressPercent}% Complete`,
            description: 'Collections are progressing steadily toward the total community festival target.',
            actionLabel: 'View Summary',
            link: '/reports',
        },
    ];

    return (
        <div
            style={{
                backgroundColor: 'var(--bg-surface, #1E1B18)',
                border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '28px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary, #FDFBF7)' }}>
                        What Needs Attention Today?
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-muted, #9CA3AF)' }}>
                        Key operational items requiring your immediate review or decision
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '16px',
                                padding: '16px 20px',
                                borderRadius: '12px',
                                backgroundColor: item.bg,
                                border: `1px solid ${item.border}`,
                                flexWrap: 'wrap',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                                <div
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        backgroundColor: item.badgeColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                        flexShrink: 0,
                                        marginTop: '2px',
                                    }}
                                >
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #FDFBF7)', marginBottom: '3px' }}>
                                        {item.title}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted, #D1D5DB)', lineHeight: 1.4 }}>
                                        {item.description}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Link
                                    to={item.link}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        minHeight: '44px',
                                        padding: '0 20px',
                                        borderRadius: '10px',
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        color: 'var(--text-primary, #FFFFFF)',
                                        fontSize: '0.925rem',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'background-color 0.2s',
                                    }}
                                >
                                    {item.actionLabel}
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
