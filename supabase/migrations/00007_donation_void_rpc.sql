-- ============================================================================
-- CollectiQ — Migration 00007: Controlled Donation Voiding
-- ============================================================================
-- Allows a donation to be marked void through a controlled server-side function
-- while keeping all other donation updates blocked.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_donation_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('app.allow_donation_void', true) = 'true'
        AND OLD.is_void = false
        AND NEW.is_void = true
        AND (to_jsonb(NEW) - 'is_void') = (to_jsonb(OLD) - 'is_void') THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Donations are immutable. Use donation_adjustments for corrections.';
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.void_donation(
    p_club_id UUID,
    p_donation_id UUID,
    p_adjusted_by_user_id UUID,
    p_reason TEXT DEFAULT 'Voided by president'
)
RETURNS donation_adjustments AS $$
DECLARE
    v_adjustment donation_adjustments;
BEGIN
    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        p_reason := 'Voided by president';
    END IF;

    PERFORM set_config('app.allow_donation_void', 'true', true);

    UPDATE donations
    SET is_void = true
    WHERE id = p_donation_id
      AND club_id = p_club_id
      AND is_void = false;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Donation not found or already voided';
    END IF;

    INSERT INTO donation_adjustments (
        club_id,
        original_donation_id,
        adjusted_by_user_id,
        adjustment_type,
        reason
    )
    VALUES (
        p_club_id,
        p_donation_id,
        p_adjusted_by_user_id,
        'void',
        p_reason
    )
    RETURNING * INTO v_adjustment;

    RETURN v_adjustment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;


REVOKE ALL ON FUNCTION public.void_donation(UUID, UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.void_donation(UUID, UUID, UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.void_donation(UUID, UUID, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.void_donation(UUID, UUID, UUID, TEXT) TO service_role;
