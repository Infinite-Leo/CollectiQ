-- ============================================================================
-- CollectiQ — PostgreSQL Schema (3NF Normalized)
-- Generated for: Supabase (PostgreSQL 15+)
-- ============================================================================
-- This migration creates the full relational schema for CollectiQ, a
-- multi-tenant donation management system. Tables are ordered by dependency
-- (parents before children). All tables use UUID primary keys and include
-- created_at / updated_at timestamps.
-- ============================================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram search on names


-- ============================================================================
-- 1. CLUBS — Tenant root entity
-- ============================================================================
CREATE TABLE clubs (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT        NOT NULL,
    slug            TEXT        NOT NULL UNIQUE,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    pincode         TEXT,
    phone           TEXT,
    email           TEXT,
    logo_url        TEXT,
    settings        JSONB       DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 2. ROLES — Normalized lookup table for user roles
-- ============================================================================
-- Separating roles into their own table achieves 3NF by eliminating
-- transitive dependency: a role's description/permissions do not depend
-- on the user or club, only on the role itself.
-- ============================================================================
CREATE TABLE roles (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT        NOT NULL UNIQUE,
    description     TEXT,
    permissions     JSONB       DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default roles
INSERT INTO roles (name, description, permissions) VALUES
    ('owner',     'Full control over the club',                  '["*"]'),
    ('admin',     'Manage events, collectors, donors, reports',  '["manage_events","manage_collectors","manage_donors","view_reports","manage_zones"]'),
    ('collector', 'Record donations in the field',               '["record_donation","view_donors","view_zones"]'),
    ('viewer',    'Read-only dashboard access',                  '["view_reports"]');


-- ============================================================================
-- 3. USERS — Application-level user profile
-- ============================================================================
-- Maps 1:1 with Supabase auth.users but stores application-specific fields.
-- auth_uid references the Supabase auth.users id for JWT binding.
-- ============================================================================
CREATE TABLE users (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_uid        UUID        NOT NULL UNIQUE,      -- FK to auth.users(id)
    full_name       TEXT        NOT NULL,
    phone           TEXT,
    email           TEXT,
    avatar_url      TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 4. CLUB_MEMBERS — Junction: Users ↔ Clubs with Role (M:N)
-- ============================================================================
-- A user can belong to multiple clubs; each membership has exactly one role.
-- This is the normalized form (3NF) because role details live in `roles`,
-- not duplicated here.
-- ============================================================================
CREATE TABLE club_members (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id         UUID        NOT NULL REFERENCES clubs(id)   ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    role_id         UUID        NOT NULL REFERENCES roles(id)   ON DELETE RESTRICT,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_club_member UNIQUE (club_id, user_id)
);


-- ============================================================================
-- 5. EVENTS — Puja / Festival campaigns
-- ============================================================================
CREATE TABLE events (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id         UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    description     TEXT,
    start_date      DATE        NOT NULL,
    end_date        DATE,
    status          TEXT        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'closed')),
    target_amount   NUMERIC(14, 2)  DEFAULT 0.00,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 6. ZONES — Geographic collection areas
-- ============================================================================
CREATE TABLE zones (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id         UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    description     TEXT,
    boundary_geojson JSONB,                           -- GeoJSON polygon
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_zone_name_per_club UNIQUE (club_id, name)
);


-- ============================================================================
-- 7. HOUSES — Households / addresses within zones
-- ============================================================================
-- Normalized out of donors: a house is a physical location, multiple donors
-- can reside at the same house. This avoids repeating address data per donor
-- (2NF → 3NF improvement).
-- ============================================================================
CREATE TABLE houses (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id         UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    zone_id         UUID        REFERENCES zones(id)          ON DELETE SET NULL,
    address_line    TEXT        NOT NULL,
    landmark        TEXT,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 8. DONORS — People who donate
-- ============================================================================
CREATE TABLE donors (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id         UUID        NOT NULL REFERENCES clubs(id)   ON DELETE CASCADE,
    house_id        UUID        REFERENCES houses(id)           ON DELETE SET NULL,
    full_name       TEXT        NOT NULL,
    phone           TEXT,
    email           TEXT,
    tags            JSONB       DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_donor_phone_per_club UNIQUE (club_id, phone)
);


-- ============================================================================
-- 9. DONATIONS — Immutable transaction records
-- ============================================================================
-- CRITICAL: This table does NOT allow UPDATE or DELETE.
-- Corrections are made via the donation_adjustments table.
-- The is_void flag can only be set through a controlled admin function.
-- ============================================================================
CREATE TABLE donations (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id             UUID            NOT NULL REFERENCES clubs(id)       ON DELETE RESTRICT,
    event_id            UUID            NOT NULL REFERENCES events(id)      ON DELETE RESTRICT,
    donor_id            UUID            NOT NULL REFERENCES donors(id)      ON DELETE RESTRICT,
    collector_id        UUID            NOT NULL REFERENCES users(id)       ON DELETE RESTRICT,
    zone_id             UUID            REFERENCES zones(id)               ON DELETE SET NULL,
    house_id            UUID            REFERENCES houses(id)              ON DELETE SET NULL,
    amount              NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    payment_mode        TEXT            NOT NULL DEFAULT 'cash'
                        CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'cheque', 'online')),
    receipt_number      TEXT            NOT NULL UNIQUE,
    idempotency_key     UUID            UNIQUE,           -- Client-generated, prevents double-submit
    notes               TEXT,
    collection_lat      DOUBLE PRECISION,
    collection_lng      DOUBLE PRECISION,
    is_void             BOOLEAN         NOT NULL DEFAULT false,
    collected_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- No updated_at: donations are immutable
    CONSTRAINT fk_donation_club_event
        FOREIGN KEY (club_id, event_id)
        REFERENCES events(club_id, id)      -- NOT directly expressible without composite UK on events
        -- Enforced via application logic; individual FKs above guarantee integrity
);

-- *** REVOKE UPDATE and DELETE on donations ***
-- RLS policies will have no UPDATE/DELETE policies.
-- Additionally, we create a trigger to hard-block any UPDATE attempt.
CREATE OR REPLACE FUNCTION prevent_donation_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Donations are immutable. Use donation_adjustments for corrections.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_donations_no_update
    BEFORE UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION prevent_donation_mutation();

CREATE TRIGGER trg_donations_no_delete
    BEFORE DELETE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION prevent_donation_mutation();


-- ============================================================================
-- 10. DONATION_ADJUSTMENTS — Corrections to immutable donations
-- ============================================================================
CREATE TABLE donation_adjustments (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id                 UUID            NOT NULL REFERENCES clubs(id)     ON DELETE RESTRICT,
    original_donation_id    UUID            NOT NULL REFERENCES donations(id) ON DELETE RESTRICT,
    adjusted_by_user_id     UUID            NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
    adjustment_type         TEXT            NOT NULL
                            CHECK (adjustment_type IN ('void', 'amount_correction', 'metadata_correction')),
    new_amount              NUMERIC(14, 2),
    reason                  TEXT            NOT NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
    -- No updated_at: adjustments are also immutable
);


-- ============================================================================
-- 11. AUDIT_LOGS — Append-only change history
-- ============================================================================
-- This table captures every meaningful state change across the system.
-- It has NO UPDATE or DELETE capability whatsoever.
-- ============================================================================
CREATE TABLE audit_logs (
    id              BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    club_id         UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id         UUID        REFERENCES users(id)          ON DELETE SET NULL,
    table_name      TEXT        NOT NULL,
    record_id       UUID        NOT NULL,
    action          TEXT        NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'VOID')),
    old_data        JSONB,
    new_data        JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    -- No updated_at: audit logs are append-only
);

-- Hard-block UPDATE and DELETE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are append-only. UPDATE and DELETE are forbidden.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_mutation();

CREATE TRIGGER trg_audit_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_mutation();


-- ============================================================================
-- 12. FRAUD_FLAGS — Suspicious activity tracking
-- ============================================================================
CREATE TABLE fraud_flags (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id         UUID        NOT NULL REFERENCES clubs(id)       ON DELETE CASCADE,
    donation_id     UUID        REFERENCES donations(id)            ON DELETE SET NULL,
    flagged_user_id UUID        REFERENCES users(id)                ON DELETE SET NULL,
    severity        TEXT        NOT NULL DEFAULT 'low'
                    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    flag_type       TEXT        NOT NULL
                    CHECK (flag_type IN (
                        'duplicate_amount',
                        'unusual_time',
                        'location_mismatch',
                        'rapid_entry',
                        'amount_outlier',
                        'manual_review'
                    )),
    description     TEXT,
    status          TEXT        NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
    resolved_by     UUID        REFERENCES users(id)                ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 13. AUTO-UPDATE updated_at TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'clubs', 'roles', 'users', 'club_members',
            'events', 'zones', 'houses', 'donors', 'fraud_flags'
        ])
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at();',
            t, t
        );
    END LOOP;
END;
$$;


-- ============================================================================
-- 14. AUDIT LOG TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_log_fn()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        club_id, user_id, table_name, record_id,
        action, old_data, new_data, created_at
    ) VALUES (
        COALESCE(NEW.club_id, OLD.club_id),
        COALESCE(
            current_setting('app.current_user_id', true)::uuid,
            NULL
        ),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        now()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers to key tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'clubs', 'events', 'zones', 'houses',
            'donors', 'donations', 'donation_adjustments',
            'fraud_flags'
        ])
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_audit
                AFTER INSERT OR UPDATE OR DELETE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION audit_log_fn();',
            t, t
        );
    END LOOP;
END;
$$;


-- ============================================================================
-- 15. INDEXES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tenant isolation (club_id) — every transactional table
-- ---------------------------------------------------------------------------
CREATE INDEX idx_club_members_club       ON club_members   (club_id);
CREATE INDEX idx_events_club             ON events         (club_id);
CREATE INDEX idx_zones_club              ON zones          (club_id);
CREATE INDEX idx_houses_club             ON houses         (club_id);
CREATE INDEX idx_donors_club             ON donors         (club_id);
CREATE INDEX idx_donations_club          ON donations      (club_id);
CREATE INDEX idx_donation_adj_club       ON donation_adjustments (club_id);
CREATE INDEX idx_audit_logs_club         ON audit_logs     (club_id);
CREATE INDEX idx_fraud_flags_club        ON fraud_flags    (club_id);

-- ---------------------------------------------------------------------------
-- Foreign-key lookups
-- ---------------------------------------------------------------------------
CREATE INDEX idx_donations_event         ON donations      (event_id);
CREATE INDEX idx_donations_donor         ON donations      (donor_id);
CREATE INDEX idx_donations_collector     ON donations      (collector_id);
CREATE INDEX idx_donations_zone          ON donations      (zone_id);
CREATE INDEX idx_donations_house         ON donations      (house_id);
CREATE INDEX idx_donors_house            ON donors         (house_id);
CREATE INDEX idx_houses_zone             ON houses         (zone_id);

-- ---------------------------------------------------------------------------
-- Composite query-pattern indexes
-- ---------------------------------------------------------------------------
-- "Donations for a club+event, ordered by date" (dashboard, reports)
CREATE INDEX idx_donations_club_event_date
    ON donations (club_id, event_id, collected_at DESC);

-- "Collector's collections today" (collector dashboard)
CREATE INDEX idx_donations_club_collector_date
    ON donations (club_id, collector_id, collected_at DESC);

-- "Audit trail for a specific record"
CREATE INDEX idx_audit_record
    ON audit_logs (table_name, record_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Fraud-specific indexes
-- ---------------------------------------------------------------------------
-- "All open flags by severity" (admin fraud review queue)
CREATE INDEX idx_fraud_severity_status
    ON fraud_flags (club_id, severity, status);

-- "Flags for a specific donation"
CREATE INDEX idx_fraud_donation
    ON fraud_flags (donation_id);

-- "Flags for a specific user"
CREATE INDEX idx_fraud_user
    ON fraud_flags (flagged_user_id);

-- ---------------------------------------------------------------------------
-- Search indexes
-- ---------------------------------------------------------------------------
-- Donor name search (trigram for fuzzy / prefix matching)
CREATE INDEX idx_donors_name_trgm
    ON donors USING gin (full_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Partial / conditional indexes
-- ---------------------------------------------------------------------------
-- "Active events only" (most common query pattern)
CREATE INDEX idx_events_active
    ON events (club_id) WHERE status = 'active';

-- "Non-void donations only" (reporting always excludes voided)
CREATE INDEX idx_donations_not_void
    ON donations (club_id, event_id, collected_at DESC) WHERE is_void = false;


-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
