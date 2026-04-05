// Payment modes and statuses used across the application
export const PAYMENT_MODES = {
    CASH: 'cash',
    UPI: 'upi',
    CHEQUE: 'cheque',
    BANK_TRANSFER: 'bank_transfer',
};

export const PAYMENT_STATUSES = {
    PAID: 'paid',
    DUE: 'due',
};

// UI display options
export const PAYMENT_MODE_OPTIONS = [
    { value: PAYMENT_MODES.CASH, label: '💵 Cash' },
    { value: PAYMENT_MODES.UPI, label: '📱 Online' },
    { value: PAYMENT_MODES.CHEQUE, label: '🏦 Cheque' },
];

export const PAYMENT_STATUS_OPTIONS = [
    { value: PAYMENT_STATUSES.PAID, label: '✅ Paid' },
    { value: PAYMENT_STATUSES.DUE, label: '⏳ Due' },
];
