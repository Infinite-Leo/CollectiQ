-- ============================================================================
-- CollectiQ — Migration 00009: Business-Ready Operational Foundations
-- Supports smart houses, donor profiling, visit schedules, fund allocations & approvals
-- ============================================================================

-- 1. Evolve HOUSES Table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'houses' AND column_name = 'last_visit_date'
    ) THEN
        ALTER TABLE public.houses ADD COLUMN last_visit_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'houses' AND column_name = 'next_followup_date'
    ) THEN
        ALTER TABLE public.houses ADD COLUMN next_followup_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'houses' AND column_name = 'expected_amount'
    ) THEN
        ALTER TABLE public.houses ADD COLUMN expected_amount NUMERIC(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'houses' AND column_name = 'assigned_collector_id'
    ) THEN
        ALTER TABLE public.houses ADD COLUMN assigned_collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'houses' AND column_name = 'household_notes'
    ) THEN
        ALTER TABLE public.houses ADD COLUMN household_notes TEXT;
    END IF;
END $$;

-- 2. Evolve DONORS Table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'donors' AND column_name = 'preferred_payment_mode'
    ) THEN
        ALTER TABLE public.donors ADD COLUMN preferred_payment_mode VARCHAR(20) DEFAULT 'CASH';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'donors' AND column_name = 'contribution_profile'
    ) THEN
        ALTER TABLE public.donors ADD COLUMN contribution_profile JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. VISIT SCHEDULES / APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.visit_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id         UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    collector_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    donor_id        UUID REFERENCES public.donors(id) ON DELETE CASCADE,
    house_id        UUID REFERENCES public.houses(id) ON DELETE CASCADE,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    notes           TEXT,
    status          VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. CAMPAIGN BUDGET ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.campaign_budget_allocations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id             UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    campaign_id         UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    category            VARCHAR(100) NOT NULL, -- e.g. 'Pandal & Decoration', 'Lighting & Sound', 'Bhog & Catering', 'Permissions & Security', 'Cultural Programs'
    allocated_amount    NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_amount >= 0),
    spent_amount        NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (spent_amount >= 0),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_campaign_budget_category UNIQUE (campaign_id, category)
);

-- 5. APPROVAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id             UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    action_type         VARCHAR(50) NOT NULL,
    target_table        VARCHAR(100),
    target_record_id    UUID,
    details             JSONB DEFAULT '{}'::jsonb,
    requested_by        UUID NOT NULL REFERENCES public.users(id),
    approved_by         UUID REFERENCES public.users(id),
    status              VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    resolved_at         TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_visit_schedules_collector ON public.visit_schedules(collector_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_club ON public.visit_schedules(club_id);
CREATE INDEX IF NOT EXISTS idx_campaign_allocations ON public.campaign_budget_allocations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_pending ON public.approval_requests(club_id, status) WHERE status = 'PENDING';

-- 6. DONOR PROFILING FUNCTION
CREATE OR REPLACE FUNCTION public.get_donor_profile(p_donor_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_donor RECORD;
    v_total_amount NUMERIC(15, 2) := 0.00;
    v_total_count INT := 0;
    v_avg_amount NUMERIC(15, 2) := 0.00;
    v_max_amount NUMERIC(15, 2) := 0.00;
    v_pref_mode TEXT := 'CASH';
    v_pending_amount NUMERIC(15, 2) := 0.00;
    v_pending_count INT := 0;
    v_last_donation TIMESTAMPTZ;
    v_classification TEXT := 'REGULAR';
    v_yoy JSONB := '[]'::jsonb;
BEGIN
    SELECT * INTO v_donor FROM public.donors WHERE id = p_donor_id;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Calculate from donations
    SELECT 
        COALESCE(SUM(amount), 0),
        COUNT(*),
        COALESCE(AVG(amount), 0),
        COALESCE(MAX(amount), 0),
        MAX(created_at)
    INTO 
        v_total_amount,
        v_total_count,
        v_avg_amount,
        v_max_amount,
        v_last_donation
    FROM public.donations
    WHERE donor_id = p_donor_id AND is_void = FALSE;

    -- Preferred payment mode
    SELECT payment_method
    INTO v_pref_mode
    FROM public.donations
    WHERE donor_id = p_donor_id AND is_void = FALSE
    GROUP BY payment_method
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    IF v_pref_mode IS NULL THEN
        v_pref_mode := COALESCE(v_donor.preferred_payment_mode, 'CASH');
    END IF;

    -- Pending calculations from collection ledgers if available
    SELECT 
        COALESCE(SUM(promised_amount - collected_amount), 0),
        COUNT(*)
    INTO
        v_pending_amount,
        v_pending_count
    FROM public.collection_ledgers
    WHERE donor_id = p_donor_id AND payment_status != 'PAID';

    -- Classification logic
    IF v_total_amount >= 10000 OR v_max_amount >= 5000 THEN
        v_classification := 'HIGH_VALUE';
    ELSIF v_total_count = 0 THEN
        v_classification := 'NEW';
    ELSIF v_pending_count > 0 THEN
        v_classification := 'NEEDS_FOLLOWUP';
    ELSE
        v_classification := 'REGULAR';
    END IF;

    -- YoY Breakdown
    SELECT jsonb_agg(
        jsonb_build_object(
            'year', EXTRACT(YEAR FROM created_at)::INT,
            'amount', SUM(amount)
        ) ORDER BY EXTRACT(YEAR FROM created_at) ASC
    )
    INTO v_yoy
    FROM public.donations
    WHERE donor_id = p_donor_id AND is_void = FALSE
    GROUP BY EXTRACT(YEAR FROM created_at);

    RETURN jsonb_build_object(
        'donor_id', v_donor.id,
        'full_name', v_donor.full_name,
        'phone', v_donor.phone,
        'email', v_donor.email,
        'house_id', v_donor.house_id,
        'total_lifetime_amount', v_total_amount,
        'total_donations_count', v_total_count,
        'average_donation', ROUND(v_avg_amount, 2),
        'highest_donation', v_max_amount,
        'preferred_payment_mode', v_pref_mode,
        'pending_amount', v_pending_amount,
        'pending_count', v_pending_count,
        'last_donation_date', v_last_donation,
        'classification', v_classification,
        'yoy_history', COALESCE(v_yoy, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS & Grants
ALTER TABLE public.visit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY visit_schedules_all ON public.visit_schedules FOR ALL USING (true);
CREATE POLICY campaign_budget_allocations_all ON public.campaign_budget_allocations FOR ALL USING (true);
CREATE POLICY approval_requests_all ON public.approval_requests FOR ALL USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_schedules TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_budget_allocations TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_requests TO authenticated, anon;
