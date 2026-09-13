-- ============================================================================
-- CollectiQ — Migration 00008: Indian Operational Handovers & Finance Layers
-- Evolve CollectiQ Core to Support Indian Operational Handovers & Finance Layers
-- ============================================================================

-- Types (Idempotent creation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_state') THEN
        CREATE TYPE public.payment_state AS ENUM ('PAID', 'PARTIAL', 'PENDING');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'settlement_method') THEN
        CREATE TYPE public.settlement_method AS ENUM ('UPI', 'CASH', 'BANK_TRANSFER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'anomaly_severity') THEN
        CREATE TYPE public.anomaly_severity AS ENUM ('LOW', 'MEDIUM', 'CRITICAL');
    END IF;
END $$;

-- A. Geographic Zone & Local Municipality Mapping
CREATE TABLE IF NOT EXISTS public.geo_localities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(100) NOT NULL,       -- e.g., 'Salt Lake', 'Behala', 'Dum Dum'
    ward_number VARCHAR(50) NOT NULL,      -- e.g., 'Ward 42'
    sector_block VARCHAR(100),             -- e.g., 'Sector V, Block AE'
    city VARCHAR(100) DEFAULT 'Kolkata',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_zone_ward_block UNIQUE (zone_name, ward_number, sector_block)
);

-- B. Evolve Existing Donors Table (Preserve constraints, add spatial & regional traits)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'donors' AND column_name = 'locality_id'
    ) THEN
        ALTER TABLE public.donors 
            ADD COLUMN locality_id UUID REFERENCES public.geo_localities(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'donors' AND column_name = 'gps_coordinates'
    ) THEN
        ALTER TABLE public.donors 
            ADD COLUMN gps_coordinates POINT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'donors' AND column_name = 'secondary_mobile'
    ) THEN
        ALTER TABLE public.donors 
            ADD COLUMN secondary_mobile VARCHAR(15);
    END IF;
END $$;

-- C. Transaction Allocation Ledger
CREATE TABLE IF NOT EXISTS public.collection_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL,             -- References existing campaign/event entity
    donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE RESTRICT,
    collector_id UUID NOT NULL,            -- References system user/collector ID
    promised_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (promised_amount >= 0),
    collected_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (collected_amount <= promised_amount),
    payment_status public.payment_state DEFAULT 'PENDING',
    payment_mode public.settlement_method,
    gps_captured_at POINT,
    physical_address_raw TEXT,             -- Geocoded address text captured via device GPS
    whatsapp_reminders_sent INT DEFAULT 0,
    last_reminder_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- D. Cash Liquidity & Cashier Reconciliation Ledger
CREATE TABLE IF NOT EXISTS public.cash_handover_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collector_id UUID NOT NULL,
    cashier_id UUID NOT NULL,
    amount_declared NUMERIC(15, 2) NOT NULL CHECK (amount_declared > 0),
    amount_verified NUMERIC(15, 2),
    discrepancy_detected BOOLEAN DEFAULT FALSE,
    handover_status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (handover_status IN ('SUBMITTED', 'RECONCILED', 'DISPUTED')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reconciled_at TIMESTAMP WITH TIME ZONE
);

-- E. Anomaly Review Engine (Upgrading the Fraud Flag System)
CREATE TABLE IF NOT EXISTS public.anomaly_review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_table VARCHAR(100) NOT NULL,
    target_record_id UUID NOT NULL,
    flagged_by_system BOOLEAN DEFAULT TRUE,
    severity_level public.anomaly_severity DEFAULT 'LOW',
    reason_code TEXT NOT NULL,             -- e.g., 'VELOCITY_LIMIT_EXCEEDED', 'GPS_MISMATCH', 'CASH_DISCREPANCY'
    review_status VARCHAR(50) DEFAULT 'OPEN' CHECK (review_status IN ('OPEN', 'INVESTIGATING', 'RESOLVED_VALID', 'RESOLVED_ANOMALOUS')),
    assigned_admin_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- F. Event Expenditure & Budget Allocation Ledger
CREATE TABLE IF NOT EXISTS public.expenditure_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL,
    allocated_budget NUMERIC(15, 2) NOT NULL CHECK (allocated_budget >= 0),
    amount_spent NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (amount_spent <= allocated_budget),
    expense_category VARCHAR(100) NOT NULL, -- e.g., 'Pandal Structure', 'Lighting/Illumination', 'Bhog/Prasad', 'Permissions'
    vendor_details JSONB,                  -- Maps vendor name, GSTIN, and contact details
    paid_via public.settlement_method NOT NULL,
    logged_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance and Geospatial Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_payment_status ON public.collection_ledgers(payment_status) WHERE payment_status != 'PAID';
CREATE INDEX IF NOT EXISTS idx_handover_unreconciled ON public.cash_handover_registry(handover_status) WHERE handover_status = 'SUBMITTED';
CREATE INDEX IF NOT EXISTS idx_collection_ledgers_campaign ON public.collection_ledgers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_collection_ledgers_collector ON public.collection_ledgers(collector_id);
CREATE INDEX IF NOT EXISTS idx_expenditure_campaign ON public.expenditure_ledger(campaign_id);

-- G. Stored Procedure for Atomic Handover Reconciliation
CREATE OR REPLACE FUNCTION public.reconcile_cash_handover(
    p_handover_id UUID,
    p_cashier_id UUID,
    p_amount_verified NUMERIC(15, 2),
    p_action TEXT DEFAULT 'RECONCILE', -- 'RECONCILE', 'DISPUTE', 'CLEAR_ANOMALY_EXPENSE'
    p_discrepancy_reason TEXT DEFAULT NULL,
    p_campaign_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_handover public.cash_handover_registry;
    v_diff NUMERIC(15, 2);
    v_discrepancy BOOLEAN := FALSE;
    v_new_status VARCHAR(50);
    v_severity public.anomaly_severity := 'LOW';
    v_anomaly_id UUID := NULL;
    v_expense_id UUID := NULL;
BEGIN
    SELECT * INTO v_handover
    FROM public.cash_handover_registry
    WHERE id = p_handover_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Handover record % not found', p_handover_id;
    END IF;

    v_diff := ABS(v_handover.amount_declared - p_amount_verified);
    IF v_diff > 0.001 THEN
        v_discrepancy := TRUE;
    END IF;

    IF p_action = 'DISPUTE' THEN
        v_new_status := 'DISPUTED';
    ELSE
        v_new_status := 'RECONCILED';
    END IF;

    -- Update handover record
    UPDATE public.cash_handover_registry
    SET cashier_id = p_cashier_id,
        amount_verified = p_amount_verified,
        discrepancy_detected = v_discrepancy,
        handover_status = v_new_status,
        reconciled_at = CURRENT_TIMESTAMP
    WHERE id = p_handover_id;

    -- Handle discrepancy routing
    IF v_discrepancy THEN
        IF v_diff > 5000 THEN
            v_severity := 'CRITICAL';
        ELSIF v_diff > 1000 THEN
            v_severity := 'MEDIUM';
        ELSE
            v_severity := 'LOW';
        END IF;

        IF p_action = 'CLEAR_ANOMALY_EXPENSE' AND p_campaign_id IS NOT NULL THEN
            -- Record out-of-pocket verified campaign cost in expenditure ledger
            INSERT INTO public.expenditure_ledger (
                campaign_id,
                allocated_budget,
                amount_spent,
                expense_category,
                vendor_details,
                paid_via,
                logged_by
            )
            VALUES (
                p_campaign_id,
                v_diff,
                v_diff,
                'Out-of-pocket Campaign Cost',
                jsonb_build_object(
                    'note', COALESCE(p_discrepancy_reason, 'Collector out-of-pocket field cost verified during cash handover reconciliation'),
                    'collector_id', v_handover.collector_id
                ),
                'CASH',
                p_cashier_id
            )
            RETURNING id INTO v_expense_id;

            -- Log resolved anomaly
            INSERT INTO public.anomaly_review_logs (
                target_table,
                target_record_id,
                flagged_by_system,
                severity_level,
                reason_code,
                review_status,
                assigned_admin_id
            )
            VALUES (
                'cash_handover_registry',
                p_handover_id,
                TRUE,
                v_severity,
                'CASH_DISCREPANCY_CLEARED_EXPENSE',
                'RESOLVED_VALID',
                p_cashier_id
            )
            RETURNING id INTO v_anomaly_id;
        ELSE
            -- Log open discrepancy for anomaly review engine
            INSERT INTO public.anomaly_review_logs (
                target_table,
                target_record_id,
                flagged_by_system,
                severity_level,
                reason_code,
                review_status,
                assigned_admin_id
            )
            VALUES (
                'cash_handover_registry',
                p_handover_id,
                TRUE,
                v_severity,
                COALESCE(p_discrepancy_reason, 'CASH_DISCREPANCY'),
                'OPEN',
                p_cashier_id
            )
            RETURNING id INTO v_anomaly_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'handover_id', p_handover_id,
        'handover_status', v_new_status,
        'discrepancy_detected', v_discrepancy,
        'difference', v_diff,
        'anomaly_id', v_anomaly_id,
        'expense_id', v_expense_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
