-- ============================================================================
-- CollectiQ — Migration 00002: SRS-Driven Schema Additions
-- ============================================================================
-- Adds: payment_status, device_id on donations; subscriptions table;
-- expenses table; last_year_amount on houses; SRS-aligned role seeds.
-- ============================================================================


-- ============================================================================
-- 1. UPDATE ROLE SEEDS — Align with SRS roles
-- ============================================================================
-- SRS defines: President, Secretary, Cashier, Collector
-- Map: owner → president, admin → secretary, add cashier
UPDATE roles SET name = 'president',  description = 'Full control over the club'
    WHERE name = 'owner';
UPDATE roles SET name = 'secretary',  description = 'Manage members, view reports, edit club details'
    WHERE name = 'admin';
UPDATE roles SET name = 'cashier',    description = 'View financial dashboard, daily tally, export data'
    WHERE name = 'viewer';

-- Insert cashier if not exists (in case viewer was already updated)
INSERT INTO roles (name, description, permissions)
VALUES ('cashier', 'View financial dashboard, daily tally, export data',
        '["view_reports","view_financials","export_data"]')
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 2. ADD COLUMNS TO DONATIONS — payment_status, device_id
-- ============================================================================
-- SRS requires: Payment Status (Paid/Due) and Device ID tracking
ALTER TABLE donations
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid'
        CHECK (payment_status IN ('paid', 'due')),
    ADD COLUMN IF NOT EXISTS device_id      TEXT;


-- ============================================================================
-- 3. ADD COLUMNS TO HOUSES — last year donation, donor_name, event linkage
-- ============================================================================
-- SRS: "Last year donation storage" per house for priority scoring
ALTER TABLE houses
    ADD COLUMN IF NOT EXISTS event_id            UUID REFERENCES events(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS donor_name          TEXT,
    ADD COLUMN IF NOT EXISTS phone               TEXT,
    ADD COLUMN IF NOT EXISTS last_year_amount    NUMERIC(14, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS is_collected        BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS priority            TEXT DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'critical'));


-- ============================================================================
-- 4. SUBSCRIPTIONS — Event-based billing per SRS §3.9
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id         UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    plan_type       TEXT        NOT NULL CHECK (plan_type IN ('1_year', '5_year', 'trial')),
    event_type      TEXT,                              -- e.g., 'durga_puja', 'ganesh_puja'
    max_collectors  INTEGER     NOT NULL DEFAULT 5,
    features        JSONB       DEFAULT '[]'::jsonb,   -- enabled feature flags
    starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN     NOT NULL DEFAULT true,
    payment_ref     TEXT,                              -- external payment gateway reference
    amount_paid     NUMERIC(10, 2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_club ON subscriptions (club_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
    ON subscriptions (club_id) WHERE is_active = true;


-- ============================================================================
-- 5. EXPENSES — Track club spending (visible in SRS §3.6 / screenshots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id         UUID            NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    event_id        UUID            REFERENCES events(id)         ON DELETE SET NULL,
    category        TEXT            NOT NULL
                    CHECK (category IN (
                        'decoration', 'idol', 'lighting_sound',
                        'pandal_setup', 'permissions', 'prasad',
                        'transport', 'catering', 'other'
                    )),
    description     TEXT,
    vendor_name     TEXT,
    amount          NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    receipt_url     TEXT,                               -- uploaded receipt image
    approved_by     UUID            REFERENCES users(id) ON DELETE SET NULL,
    status          TEXT            NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    expense_date    DATE            NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_club       ON expenses (club_id);
CREATE INDEX IF NOT EXISTS idx_expenses_event      ON expenses (club_id, event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses (club_id, category);


-- ============================================================================
-- 6. DONATION INDEX — payment_status filter
-- ============================================================================
-- "Pending dues" dashboard query
CREATE INDEX IF NOT EXISTS idx_donations_due
    ON donations (club_id, event_id, collector_id)
    WHERE payment_status = 'due';

-- Payment mode split queries
CREATE INDEX IF NOT EXISTS idx_donations_payment_mode
    ON donations (club_id, event_id, payment_mode)
    WHERE is_void = false;


-- ============================================================================
-- 7. AUTO updated_at TRIGGERS for new tables
-- ============================================================================
CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================================
-- 8. AUDIT TRIGGERS for new tables
-- ============================================================================
CREATE TRIGGER trg_subscriptions_audit
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION audit_log_fn();

CREATE TRIGGER trg_expenses_audit
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION audit_log_fn();


-- ============================================================================
-- MIGRATION 00002 COMPLETE
-- ============================================================================
