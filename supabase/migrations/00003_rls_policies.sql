-- ============================================================================
-- CollectiQ — Migration 00003: Row-Level Security Policies
-- ============================================================================
-- Multi-tenant isolation + role-based access control
-- Roles: president, secretary, cashier, collector
-- ============================================================================

-- Helper: extract club_id from JWT custom claims
-- In Supabase, custom claims are stored in auth.jwt()->'app_metadata'
-- We set club_id and role during the Auth hook on sign-in.
CREATE OR REPLACE FUNCTION auth_club_id() RETURNS UUID AS $$
    SELECT COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'club_id')::uuid,
        (current_setting('request.jwt.claims', true)::jsonb ->> 'club_id')::uuid
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_role() RETURNS TEXT AS $$
    SELECT COALESCE(
        current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role',
        current_setting('request.jwt.claims', true)::jsonb ->> 'role'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_uid() RETURNS UUID AS $$
    SELECT COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid,
        NULL
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE clubs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones                ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses             ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- CLUBS
-- ============================================================================
-- All members can read their own club
CREATE POLICY clubs_select ON clubs FOR SELECT
    USING (id = auth_club_id());

-- Only president can update
CREATE POLICY clubs_update ON clubs FOR UPDATE
    USING (id = auth_club_id() AND auth_role() = 'president');


-- ============================================================================
-- CLUB_MEMBERS
-- ============================================================================
-- All members can see who's in their club
CREATE POLICY club_members_select ON club_members FOR SELECT
    USING (club_id = auth_club_id());

-- President + secretary can manage members
CREATE POLICY club_members_insert ON club_members FOR INSERT
    WITH CHECK (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );

CREATE POLICY club_members_update ON club_members FOR UPDATE
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );

CREATE POLICY club_members_delete ON club_members FOR DELETE
    USING (
        club_id = auth_club_id()
        AND auth_role() = 'president'
    );


-- ============================================================================
-- EVENTS
-- ============================================================================
-- All roles can read events
CREATE POLICY events_select ON events FOR SELECT
    USING (club_id = auth_club_id());

-- President + secretary can create/update
CREATE POLICY events_insert ON events FOR INSERT
    WITH CHECK (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );

CREATE POLICY events_update ON events FOR UPDATE
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );


-- ============================================================================
-- ZONES
-- ============================================================================
CREATE POLICY zones_select ON zones FOR SELECT
    USING (club_id = auth_club_id());

CREATE POLICY zones_insert ON zones FOR INSERT
    WITH CHECK (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );

CREATE POLICY zones_update ON zones FOR UPDATE
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );


-- ============================================================================
-- HOUSES
-- ============================================================================
CREATE POLICY houses_select ON houses FOR SELECT
    USING (club_id = auth_club_id());

CREATE POLICY houses_insert ON houses FOR INSERT
    WITH CHECK (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary', 'collector')
    );

CREATE POLICY houses_update ON houses FOR UPDATE
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );


-- ============================================================================
-- DONORS
-- ============================================================================
CREATE POLICY donors_select ON donors FOR SELECT
    USING (club_id = auth_club_id());

CREATE POLICY donors_insert ON donors FOR INSERT
    WITH CHECK (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary', 'collector')
    );

CREATE POLICY donors_update ON donors FOR UPDATE
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );


-- ============================================================================
-- DONATIONS — Most critical: IMMUTABLE
-- ============================================================================
-- All members can read their club's donations
CREATE POLICY donations_select_all ON donations FOR SELECT
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary', 'cashier')
    );

-- Collectors can only read their OWN donations
CREATE POLICY donations_select_own ON donations FOR SELECT
    USING (
        club_id = auth_club_id()
        AND auth_role() = 'collector'
        AND collector_id = (
            SELECT id FROM users WHERE auth_uid = auth_uid()
        )
    );

-- Collectors + above can INSERT (record donations)
CREATE POLICY donations_insert ON donations FOR INSERT
    WITH CHECK (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary', 'collector')
    );

-- *** NO UPDATE POLICY — donations are immutable ***
-- *** NO DELETE POLICY — donations cannot be deleted ***
-- Trigger trg_donations_no_update provides additional enforcement.


-- ============================================================================
-- DONATION_ADJUSTMENTS — Corrections by president/cashier only
-- ============================================================================
CREATE POLICY donation_adj_select ON donation_adjustments FOR SELECT
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'cashier')
    );

CREATE POLICY donation_adj_insert ON donation_adjustments FOR INSERT
    WITH CHECK (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'cashier')
    );


-- ============================================================================
-- AUDIT_LOGS — President-only visibility
-- ============================================================================
CREATE POLICY audit_select ON audit_logs FOR SELECT
    USING (
        club_id = auth_club_id()
        AND auth_role() = 'president'
    );

-- Insert only via trigger (SECURITY DEFINER), no user INSERT policy needed


-- ============================================================================
-- FRAUD_FLAGS — President + Cashier visibility (per SRS §3.7)
-- ============================================================================
CREATE POLICY fraud_select ON fraud_flags FOR SELECT
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'cashier')
    );

CREATE POLICY fraud_update ON fraud_flags FOR UPDATE
    USING (
        club_id = auth_club_id()
        AND auth_role() = 'president'
    );


-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
    USING (
        club_id = auth_club_id()
        AND auth_role() = 'president'
    );


-- ============================================================================
-- EXPENSES
-- ============================================================================
CREATE POLICY expenses_select ON expenses FOR SELECT
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary', 'cashier')
    );

CREATE POLICY expenses_insert ON expenses FOR INSERT
    WITH CHECK (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );

CREATE POLICY expenses_update ON expenses FOR UPDATE
    USING (
        club_id = auth_club_id()
        AND auth_role() IN ('president', 'secretary')
    );


-- ============================================================================
-- GRANT STATEMENTS — Least privilege
-- ============================================================================
-- Supabase uses the 'authenticated' role for logged-in users.
-- RLS policies above handle fine-grained access.

GRANT SELECT, INSERT, UPDATE, DELETE ON clubs              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON club_members       TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON events             TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON zones              TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON houses             TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON donors             TO authenticated;
GRANT SELECT, INSERT                 ON donations          TO authenticated;
GRANT SELECT, INSERT                 ON donation_adjustments TO authenticated;
GRANT SELECT                         ON audit_logs         TO authenticated;
GRANT SELECT, UPDATE                 ON fraud_flags        TO authenticated;
GRANT SELECT                         ON subscriptions      TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON expenses           TO authenticated;
GRANT SELECT                         ON roles              TO authenticated;


-- ============================================================================
-- RLS POLICIES COMPLETE
-- ============================================================================
