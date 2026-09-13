/**
 * CollectiQ Demo Role Accounts & SRS Specification
 * Pre-configured dummy credentials for instant testing & evaluation.
 */

export const DEMO_PASSWORD = 'Password@123';

export const DEMO_ROLES = [
    {
        role: 'president',
        roleTitle: 'Club President',
        name: 'Amitava Mukherjee',
        email: 'president@collectiq.com',
        password: DEMO_PASSWORD,
        phone: '9830011111',
        icon: '👑',
        badge: 'Executive Admin',
        scope: 'Full Control & Approvals',
        redirect: '/dashboard',
        accentColor: '#B45309', // Amber / Gold
        accentBg: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        description: 'Highest executive oversight, fund targets, budget & expense approvals, and high-level analytics.',
        capabilities: [
            'Full Administrative Control',
            'Expense & Budget Approvals',
            'Fraud Detection & Audit Logs',
            'Target Setting & Real-time Stats',
        ],
    },
    {
        role: 'secretary',
        roleTitle: 'General Secretary',
        name: 'Debashis Roy',
        email: 'secretary@collectiq.com',
        password: DEMO_PASSWORD,
        phone: '9830022222',
        icon: '📋',
        badge: 'Operations Lead',
        scope: 'Member Ledger & Drives',
        redirect: '/dashboard',
        accentColor: '#0369A1', // Sky Blue / Navy
        accentBg: 'rgba(14, 165, 233, 0.12)',
        borderColor: 'rgba(14, 165, 233, 0.3)',
        description: 'Operations management, member directories, collection drives, communications, and event logistics.',
        capabilities: [
            'Donor & Member Directory',
            'Drive & Zone Planning',
            'Collector Assignment',
            'Daily Collection Reports',
        ],
    },
    {
        role: 'cashier',
        roleTitle: 'Finance Cashier',
        name: 'Subhashish Ghosh',
        email: 'cashier@collectiq.com',
        password: DEMO_PASSWORD,
        phone: '9830033333',
        icon: '💰',
        badge: 'Finance Desk',
        scope: 'Cash Desk & Tally',
        redirect: '/finance',
        accentColor: '#059669', // Emerald Green
        accentBg: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        description: 'Cash counter operations, payment reconciliations, physical-to-digital ledger verifications.',
        capabilities: [
            'Cash Counter Tally',
            'Cheque / Bank Reconciliations',
            'Financial Dashboard & Exports',
            'Instant Verification Ledger',
        ],
    },
    {
        role: 'collector',
        roleTitle: 'Field Collector',
        name: 'Rahul Chakraborty',
        email: 'collector@collectiq.com',
        password: DEMO_PASSWORD,
        phone: '9830044444',
        icon: '📱',
        badge: 'Field PWA',
        scope: 'Door-to-Door & QR Passes',
        redirect: '/collector',
        accentColor: '#7C3AED', // Purple
        accentBg: 'rgba(124, 58, 237, 0.12)',
        borderColor: 'rgba(124, 58, 237, 0.3)',
        description: 'Door-to-door Puja collection, instant digital receipts, VIP / Donor QR passes, and offline syncing.',
        capabilities: [
            'Mobile-first Collection Interface',
            'Instant SMS / WhatsApp Receipts',
            'QR Pass Generation',
            'Personal Daily Tally & Targets',
        ],
    },
];

export function getDemoAccountByRole(role) {
    return DEMO_ROLES.find(r => r.role === role) || null;
}

export function getRoleRedirect(role) {
    const account = getDemoAccountByRole(role);
    return account?.redirect || '/dashboard';
}
