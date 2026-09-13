import { useState } from 'react';
import { MessageSquare, Check, ExternalLink } from 'lucide-react';
import { formatIndianCurrency } from '../utils/indianNumberFormat';

/**
 * Format localized WhatsApp reminder message
 */
export const formatReminder = (donorName = 'Donor', balanceAmount = 0, eventName = 'Durga Puja 2026', mobile = '') => {
    const formattedAmount = formatIndianCurrency(balanceAmount, false);
    const textStr = `Hello ${donorName}, this is a gentle reminder from the finance committee regarding your contribution of ₹${formattedAmount} for ${eventName}. You can settle via UPI or cash during our collector's next neighborhood visit.`;
    
    // Clean mobile number (strip spaces, dashes, prepend 91 if 10-digit Indian number)
    let cleanMobile = (mobile || '').toString().replace(/[^0-9]/g, '');
    if (cleanMobile.length === 10) {
        cleanMobile = '91' + cleanMobile;
    }
    
    const baseUrl = cleanMobile ? `https://wa.me/${cleanMobile}` : 'https://wa.me/';
    return `${baseUrl}?text=${encodeURIComponent(textStr)}`;
};

/**
 * High-contrast WhatsApp Reminder Action Button
 */
export default function ReminderTrigger({
    donorName = 'Donor',
    balanceAmount = 0,
    eventName = 'Durga Puja 2026',
    mobile = '',
    compact = false,
    onReminderSent,
}) {
    const [sent, setSent] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        const url = formatReminder(donorName, balanceAmount, eventName, mobile);
        window.open(url, '_blank', 'noopener,noreferrer');
        setSent(true);
        if (onReminderSent) {
            onReminderSent({ donorName, balanceAmount, mobile, timestamp: new Date() });
        }
        setTimeout(() => setSent(false), 8000);
    };

    if (compact) {
        return (
            <button
                type="button"
                onClick={handleClick}
                title={`Send WhatsApp reminder to ${donorName}`}
                className="btn-whatsapp-compact"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: sent ? '#E8F5E9' : '#1B5E20',
                    color: sent ? '#1B5E20' : '#FFFFFF',
                    border: '1px solid #1B5E20',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                }}
            >
                {sent ? <Check size={13} /> : <MessageSquare size={13} />}
                <span>{sent ? 'Sent' : 'WhatsApp'}</span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className="btn-whatsapp"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 12px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: sent ? '#E8F5E9' : '#1B5E20',
                color: sent ? '#1B5E20' : '#FFFFFF',
                border: '1px solid #1B5E20',
                borderRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
            }}
        >
            {sent ? <Check size={15} /> : <MessageSquare size={15} />}
            <span>{sent ? 'Reminder Opened' : 'Send WhatsApp Reminder'}</span>
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
        </button>
    );
}
