-- ============================================================================
-- CollectiQ — Migration 00006: Missing RPC Functions
-- ============================================================================

-- 1. dashboard_total_collection
CREATE OR REPLACE FUNCTION dashboard_total_collection(p_club_id UUID, p_event_id UUID DEFAULT NULL)
RETURNS TABLE (total NUMERIC, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
    FROM donations
    WHERE club_id = p_club_id
      AND (p_event_id IS NULL OR event_id = p_event_id)
      AND is_void = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. dashboard_today_collection
CREATE OR REPLACE FUNCTION dashboard_today_collection(p_club_id UUID, p_event_id UUID DEFAULT NULL)
RETURNS TABLE (total NUMERIC, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
    FROM donations
    WHERE club_id = p_club_id
      AND (p_event_id IS NULL OR event_id = p_event_id)
      AND is_void = false
      AND DATE(collected_at AT TIME ZONE 'UTC') = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. dashboard_payment_split
CREATE OR REPLACE FUNCTION dashboard_payment_split(p_club_id UUID, p_event_id UUID DEFAULT NULL)
RETURNS TABLE (payment_mode TEXT, total NUMERIC, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT d.payment_mode, COALESCE(SUM(d.amount), 0) AS total, COUNT(*) AS count
    FROM donations d
    WHERE d.club_id = p_club_id
      AND (p_event_id IS NULL OR d.event_id = p_event_id)
      AND d.is_void = false
    GROUP BY d.payment_mode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. dashboard_collector_ranking
CREATE OR REPLACE FUNCTION dashboard_collector_ranking(p_club_id UUID, p_event_id UUID DEFAULT NULL)
RETURNS TABLE (collector_id UUID, collector_name TEXT, total_amount NUMERIC, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT d.collector_id, u.full_name AS collector_name, COALESCE(SUM(d.amount), 0) AS total_amount, COUNT(*) AS count
    FROM donations d
    LEFT JOIN users u ON u.id = d.collector_id
    WHERE d.club_id = p_club_id
      AND (p_event_id IS NULL OR d.event_id = p_event_id)
      AND d.is_void = false
    GROUP BY d.collector_id, u.full_name
    ORDER BY total_amount DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. dashboard_collection_trend
CREATE OR REPLACE FUNCTION dashboard_collection_trend(p_club_id UUID, p_event_id UUID DEFAULT NULL, p_days INT DEFAULT 7)
RETURNS TABLE (date TEXT, total_amount NUMERIC) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT (CURRENT_DATE - i) AS d
        FROM generate_series(0, p_days - 1) i
    )
    SELECT 
        to_char(ds.d, 'DD Mon') AS date,
        COALESCE(SUM(d.amount), 0) AS total_amount
    FROM date_series ds
    LEFT JOIN donations d 
        ON DATE(d.collected_at AT TIME ZONE 'UTC') = ds.d 
        AND d.club_id = p_club_id 
        AND (p_event_id IS NULL OR d.event_id = p_event_id)
        AND d.is_void = false
    GROUP BY ds.d
    ORDER BY ds.d ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. next_receipt_number
CREATE OR REPLACE FUNCTION next_receipt_number(p_club_id UUID, p_event_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_counter INT;
    v_receipt TEXT;
BEGIN
    v_prefix := 'DP' || to_char(CURRENT_DATE, 'YY') || '-';
    
    SELECT COALESCE(MAX(SUBSTRING(receipt_number FROM LENGTH(v_prefix) + 1)::INT), 0) + 1
    INTO v_counter
    FROM donations
    WHERE club_id = p_club_id AND receipt_number LIKE v_prefix || '%';
    
    v_receipt := v_prefix || lpad(v_counter::TEXT, 6, '0');
    RETURN v_receipt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
