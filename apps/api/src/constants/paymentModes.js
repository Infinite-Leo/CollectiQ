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

// Valid values for validation
export const VALID_PAYMENT_MODES = Object.values(PAYMENT_MODES);
export const VALID_PAYMENT_STATUSES = Object.values(PAYMENT_STATUSES);
