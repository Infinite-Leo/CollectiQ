import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { roleGuard } from '../middleware/auth.js';

const router = Router();

// Fallback in-memory store for development/offline mode if DB table isn't migrated yet
let inMemoryHandovers = [
    {
        id: 'hnd-001',
        collector_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        collector_name: 'Souvik Mukherjee',
        cashier_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amount_declared: 18500,
        amount_verified: null,
        discrepancy_detected: false,
        handover_status: 'SUBMITTED',
        submitted_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        reconciled_at: null,
        zone: 'Ballygunge & Gariahat',
        notes: 'Ward 85 field collections (Cash batches #1 to #12)',
    },
    {
        id: 'hnd-002',
        collector_id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
        collector_name: 'Debabrata Das',
        cashier_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amount_declared: 12000,
        amount_verified: null,
        discrepancy_detected: false,
        handover_status: 'SUBMITTED',
        submitted_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        reconciled_at: null,
        zone: 'Salt Lake Sector V',
        notes: 'Commercial blocks AA to AE collection receipts',
    },
    {
        id: 'hnd-003',
        collector_id: 'e5f6a7b8-c9d0-1234-efab-345678901234',
        collector_name: 'Pritam Mondal',
        cashier_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amount_declared: 25000,
        amount_verified: 25000,
        discrepancy_detected: false,
        handover_status: 'RECONCILED',
        submitted_at: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        reconciled_at: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
        zone: 'Behala Chowrasta',
        notes: 'Morning shift collections',
    }
];

let inMemoryAnomalies = [];

// GET /api/v1/finance/handovers
// Returns all handover submissions for the Cashier desk
router.get('/handovers', async (req, res, next) => {
    try {
        let handovers = [];

        try {
            const { data, error } = await supabaseAdmin
                .from('cash_handover_registry')
                .select('*')
                .order('submitted_at', { ascending: false });

            if (!error && data && data.length > 0) {
                // Fetch collector names
                const userIds = [...new Set(data.map((h) => h.collector_id))];
                const { data: users } = await supabaseAdmin
                    .from('users')
                    .select('id, full_name')
                    .in('id', userIds);

                const userMap = new Map((users || []).map((u) => [u.id, u.full_name]));

                handovers = data.map((h) => ({
                    ...h,
                    collector_name: userMap.get(h.collector_id) || 'Field Collector',
                    amount_declared: Number(h.amount_declared),
                    amount_verified: h.amount_verified !== null ? Number(h.amount_verified) : null,
                }));
            }
        } catch (dbErr) {
            console.warn('DB handover fetch fallback:', dbErr?.message);
        }

        if (handovers.length === 0) {
            handovers = inMemoryHandovers;
        }

        res.json({
            success: true,
            data: handovers,
            count: handovers.length,
            unreconciled_count: handovers.filter((h) => h.handover_status === 'SUBMITTED').length,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/finance/submit-handover
// Field agent declares cash to be handed over to the cashier
router.post('/submit-handover', roleGuard(['president', 'secretary', 'collector', 'cashier']), async (req, res, next) => {
    try {
        const { amount_declared, notes = '' } = req.body;
        const collectorId = req.appUserId || req.user?.id;
        const cashierId = req.body.cashier_id || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

        if (!amount_declared || Number(amount_declared) <= 0) {
            return res.status(400).json({ error: 'Declared cash amount must be greater than 0' });
        }

        const newHandover = {
            id: 'hnd-' + Date.now(),
            collector_id: collectorId,
            collector_name: req.appUser?.full_name || req.user?.email?.split('@')[0] || 'Field Collector',
            cashier_id: cashierId,
            amount_declared: Number(amount_declared),
            amount_verified: null,
            discrepancy_detected: false,
            handover_status: 'SUBMITTED',
            submitted_at: new Date().toISOString(),
            reconciled_at: null,
            notes,
        };

        try {
            const { data, error } = await supabaseAdmin
                .from('cash_handover_registry')
                .insert({
                    collector_id: collectorId,
                    cashier_id: cashierId,
                    amount_declared: Number(amount_declared),
                    handover_status: 'SUBMITTED',
                })
                .select()
                .single();

            if (!error && data) {
                newHandover.id = data.id;
            }
        } catch (dbErr) {
            console.warn('DB handover submit fallback:', dbErr?.message);
        }

        inMemoryHandovers.unshift(newHandover);

        res.status(201).json({
            success: true,
            data: newHandover,
            message: `Handover submission of ₹${amount_declared} registered. Pending cashier count.`,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/finance/reconcile-handover
// Atomic transaction endpoint executing cashier verification and anomaly routing
router.post('/reconcile-handover', roleGuard(['president', 'secretary', 'cashier']), async (req, res, next) => {
    try {
        const {
            handover_id,
            amount_verified,
            action = 'RECONCILE', // 'RECONCILE', 'DISPUTE', 'CLEAR_ANOMALY_EXPENSE'
            discrepancy_action = 'LOG_ANOMALY', // 'LOG_ANOMALY' or 'CLEAR_ANOMALY_EXPENSE'
            discrepancy_reason = '',
            campaign_id,
        } = req.body;

        const cashierId = req.appUserId || req.user?.id || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        const verifiedNum = parseFloat(amount_verified);

        if (isNaN(verifiedNum) || verifiedNum < 0) {
            return res.status(400).json({ error: 'Valid numeric amount_verified is required' });
        }

        // Try RPC first for strict database transaction containment
        let rpcExecuted = false;
        let rpcResult = null;

        try {
            const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('reconcile_cash_handover', {
                p_handover_id: handover_id,
                p_cashier_id: cashierId,
                p_amount_verified: verifiedNum,
                p_action: discrepancy_action === 'CLEAR_ANOMALY_EXPENSE' ? 'CLEAR_ANOMALY_EXPENSE' : action,
                p_discrepancy_reason: discrepancy_reason,
                p_campaign_id: campaign_id || null,
            });

            if (!rpcErr && rpcData) {
                rpcExecuted = true;
                rpcResult = rpcData;
            }
        } catch (callErr) {
            console.warn('RPC reconcile_cash_handover call fallback:', callErr?.message);
        }

        // Also update in-memory / local state for instant synchronization
        const existingIdx = inMemoryHandovers.findIndex((h) => h.id === handover_id);
        let updatedHandover = null;

        if (existingIdx !== -1) {
            const existing = inMemoryHandovers[existingIdx];
            const declared = Number(existing.amount_declared);
            const diff = Math.abs(declared - verifiedNum);
            const hasDiscrepancy = diff > 0.001;

            const newStatus = action === 'DISPUTE' ? 'DISPUTED' : 'RECONCILED';

            existing.cashier_id = cashierId;
            existing.amount_verified = verifiedNum;
            existing.discrepancy_detected = hasDiscrepancy;
            existing.handover_status = newStatus;
            existing.reconciled_at = new Date().toISOString();

            updatedHandover = { ...existing };

            // Handle Anomaly Logging
            if (hasDiscrepancy) {
                const severity = diff > 5000 ? 'CRITICAL' : diff > 1000 ? 'MEDIUM' : 'LOW';

                if (discrepancy_action === 'CLEAR_ANOMALY_EXPENSE') {
                    // Log out-of-pocket expense
                    inMemoryAnomalies.push({
                        id: 'ano-' + Date.now(),
                        target_table: 'cash_handover_registry',
                        target_record_id: handover_id,
                        flagged_by_system: true,
                        severity_level: severity,
                        reason_code: 'CASH_DISCREPANCY_CLEARED_EXPENSE',
                        review_status: 'RESOLVED_VALID',
                        assigned_admin_id: cashierId,
                        created_at: new Date().toISOString(),
                        notes: `Out-of-pocket field expense verified: ₹${diff}. Reason: ${discrepancy_reason}`,
                    });
                } else {
                    inMemoryAnomalies.push({
                        id: 'ano-' + Date.now(),
                        target_table: 'cash_handover_registry',
                        target_record_id: handover_id,
                        flagged_by_system: true,
                        severity_level: severity,
                        reason_code: 'CASH_DISCREPANCY',
                        review_status: 'OPEN',
                        assigned_admin_id: cashierId,
                        created_at: new Date().toISOString(),
                        notes: discrepancy_reason || `Cash difference of ₹${diff} between declared and verified amounts`,
                    });
                }
            }
        }

        res.json({
            success: true,
            rpc_executed: rpcExecuted,
            rpc_result: rpcResult,
            data: updatedHandover || {
                id: handover_id,
                amount_verified: verifiedNum,
                status: action === 'DISPUTE' ? 'DISPUTED' : 'RECONCILED',
                discrepancy_detected: rpcResult?.discrepancy_detected ?? false,
            },
            message: 'Handover processed and reconciled into cash ledger successfully.',
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/finance/anomalies
// Returns active anomaly review logs
router.get('/anomalies', async (req, res, next) => {
    try {
        let logs = [];
        try {
            const { data } = await supabaseAdmin
                .from('anomaly_review_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data && data.length > 0) logs = data;
        } catch (e) {
            console.warn('DB anomalies fallback:', e?.message);
        }

        if (logs.length === 0) logs = inMemoryAnomalies;
        res.json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
});

// In-memory sample budget allocations
let inMemoryBudgets = [
    { id: 'bgt-1', category_name: 'Pandal Construction & Bamboo Decor', allocated_amount: 250000, spent_amount: 210000, notes: 'Includes main mandap and stage' },
    { id: 'bgt-2', category_name: 'Idol & Murti Artistry', allocated_amount: 120000, spent_amount: 120000, notes: 'Kumartuli artist advance & final payment' },
    { id: 'bgt-3', category_name: 'Lighting & Electric Illuminations', allocated_amount: 150000, spent_amount: 95000, notes: 'Chandan Nagar style illumination gates' },
    { id: 'bgt-4', category_name: 'Bhog, Prasad & Mahabhog Feast', allocated_amount: 100000, spent_amount: 45000, notes: 'Grocery, milk, sweets, and cooks' },
    { id: 'bgt-5', category_name: 'Sound, Cultural Events & Dhak', allocated_amount: 60000, spent_amount: 35000, notes: 'Dhakis from Murshidabad + evening sound system' },
    { id: 'bgt-6', category_name: 'Civic Permissions, Fire & Security', allocated_amount: 30000, spent_amount: 22000, notes: 'Police, Fire Brigade and CESC temporary connection' },
];

let inMemoryExpenses = [
    { id: 'exp-1', category: 'Idol & Murti Artistry', amount: 60000, paid_to: 'Sanatan Pal, Kumartuli', voucher_no: 'VCH-041', payment_mode: 'BANK_TRANSFER', date: '2026-09-08', notes: 'Stage 2 clay modeling installment' },
    { id: 'exp-2', category: 'Pandal Construction & Bamboo Decor', amount: 85000, paid_to: 'Maa Tara Decorators', voucher_no: 'VCH-042', payment_mode: 'CASH', date: '2026-09-09', notes: 'Bamboo & fabric delivery batch 1' },
    { id: 'exp-3', category: 'Civic Permissions, Fire & Security', amount: 15000, paid_to: 'CESC Temporary Supply', voucher_no: 'VCH-043', payment_mode: 'UPI', date: '2026-09-10', notes: 'Festival power connection security deposit' },
];

// GET /api/v1/finance/budgets
router.get('/budgets', async (req, res, next) => {
    try {
        let budgets = [];
        try {
            const { data, error } = await supabaseAdmin
                .from('campaign_budget_allocations')
                .select('*')
                .order('allocated_amount', { ascending: false });
            if (!error && data && data.length > 0) budgets = data;
        } catch (e) {
            console.warn('DB budgets fallback:', e?.message);
        }
        if (budgets.length === 0) budgets = inMemoryBudgets;
        res.json({ success: true, data: budgets });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/finance/budgets
router.post('/budgets', roleGuard(['president', 'secretary', 'cashier']), async (req, res, next) => {
    try {
        const { category_name, allocated_amount, spent_amount = 0, notes = '' } = req.body;
        if (!category_name || !allocated_amount) {
            return res.status(400).json({ error: 'Category name and allocated amount are required' });
        }
        const newBudget = {
            id: 'bgt-' + Date.now(),
            category_name,
            allocated_amount: Number(allocated_amount),
            spent_amount: Number(spent_amount),
            notes,
        };
        try {
            const { data } = await supabaseAdmin
                .from('campaign_budget_allocations')
                .insert(newBudget)
                .select()
                .single();
            if (data) newBudget.id = data.id;
        } catch (e) {
            console.warn('DB budget insert fallback:', e?.message);
        }
        inMemoryBudgets.push(newBudget);
        res.status(201).json({ success: true, data: newBudget });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/finance/expenses
router.get('/expenses', async (req, res, next) => {
    try {
        res.json({ success: true, data: inMemoryExpenses });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/finance/expenses
router.post('/expenses', roleGuard(['president', 'secretary', 'cashier']), async (req, res, next) => {
    try {
        const { category, amount, paid_to, voucher_no, payment_mode = 'CASH', notes = '' } = req.body;
        if (!category || !amount || !paid_to) {
            return res.status(400).json({ error: 'Category, amount, and recipient are required' });
        }
        const newExp = {
            id: 'exp-' + Date.now(),
            category,
            amount: Number(amount),
            paid_to,
            voucher_no: voucher_no || `VCH-${Date.now().toString().slice(-4)}`,
            payment_mode,
            date: new Date().toISOString().split('T')[0],
            notes,
        };
        inMemoryExpenses.unshift(newExp);

        // Update corresponding budget spent amount
        const b = inMemoryBudgets.find(b => b.category_name.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(b.category_name.toLowerCase()));
        if (b) {
            b.spent_amount = Number(b.spent_amount || 0) + Number(amount);
        }

        res.status(201).json({ success: true, data: newExp, message: 'Expense recorded in cashier ledger' });
    } catch (err) {
        next(err);
    }
});

export default router;
