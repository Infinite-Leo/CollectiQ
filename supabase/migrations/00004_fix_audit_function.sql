-- ============================================================================
-- CollectiQ — Migration 00004: Fix Audit Function for Clubs
-- ============================================================================
-- Fix the audit_log_fn to properly handle clubs table where club_id = id
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_log_fn()
RETURNS TRIGGER AS $$
DECLARE
    audit_club_id UUID;
BEGIN
    -- Special handling for clubs table: club_id is the id field
    IF TG_TABLE_NAME = 'clubs' THEN
        audit_club_id := COALESCE(NEW.id, OLD.id);
    ELSE
        audit_club_id := COALESCE(NEW.club_id, OLD.club_id);
    END IF;

    INSERT INTO audit_logs (
        club_id, user_id, table_name, record_id,
        action, old_data, new_data, created_at
    ) VALUES (
        audit_club_id,
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