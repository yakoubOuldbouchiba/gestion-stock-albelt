-- ==========================================================================
-- Migration V31: Add used/available area + placement-based status rules
-- Date: 2026-04-07
-- ==========================================================================

-- Add used/available area columns
ALTER TABLE rolls
    ADD COLUMN IF NOT EXISTS used_area_m2 DECIMAL(12,4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS available_area_m2 DECIMAL(12,4) NOT NULL DEFAULT 0;

ALTER TABLE waste_pieces
    ADD COLUMN IF NOT EXISTS used_area_m2 DECIMAL(12,4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS available_area_m2 DECIMAL(12,4) NOT NULL DEFAULT 0;

-- Enforce waste_pieces status constraint
ALTER TABLE waste_pieces
    DROP CONSTRAINT IF EXISTS waste_pieces_status_check;

-- Normalize legacy waste_pieces statuses into the new set
UPDATE waste_pieces
SET status = CASE status
    WHEN 'USED_IN_ORDER' THEN 'EXHAUSTED'
    WHEN 'RESERVED' THEN 'OPENED'
    WHEN 'SCRAP' THEN 'ARCHIVED'
    WHEN 'AVAILABLE' THEN 'AVAILABLE'
    WHEN 'OPENED' THEN 'OPENED'
    WHEN 'EXHAUSTED' THEN 'EXHAUSTED'
    WHEN 'ARCHIVED' THEN 'ARCHIVED'
    ELSE 'AVAILABLE'
END;

ALTER TABLE waste_pieces
    ADD CONSTRAINT waste_pieces_status_check
        CHECK (status IN ('AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED'));

-- Sync available_area_m2 from area_m2 and used_area_m2
CREATE OR REPLACE FUNCTION sync_roll_usage_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.used_area_m2 := COALESCE(NEW.used_area_m2, 0);
    NEW.available_area_m2 := GREATEST(COALESCE(NEW.area_m2, 0) - NEW.used_area_m2, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_waste_usage_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.used_area_m2 := COALESCE(NEW.used_area_m2, 0);
    NEW.available_area_m2 := GREATEST(COALESCE(NEW.area_m2, 0) - NEW.used_area_m2, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rolls_sync_usage ON rolls;
CREATE TRIGGER trigger_rolls_sync_usage
BEFORE INSERT OR UPDATE ON rolls
FOR EACH ROW EXECUTE FUNCTION sync_roll_usage_fields();

DROP TRIGGER IF EXISTS trigger_waste_pieces_sync_usage ON waste_pieces;
CREATE TRIGGER trigger_waste_pieces_sync_usage
BEFORE INSERT OR UPDATE ON waste_pieces
FOR EACH ROW EXECUTE FUNCTION sync_waste_usage_fields();

-- Recalculate used/available area and status from placements
CREATE OR REPLACE FUNCTION recalc_roll_usage_and_status(p_roll_id UUID)
RETURNS VOID AS $$
DECLARE
    v_used_area DECIMAL(12,4);
    v_area DECIMAL(12,4);
    v_available_area DECIMAL(12,4);
    v_material_type VARCHAR(20);
    v_status VARCHAR(20);
    v_min_width_mm INTEGER;
    v_min_length_m DECIMAL(10,2);
    v_threshold_area DECIMAL(12,4);
    v_placement_count INTEGER;
    v_next_status VARCHAR(20);
BEGIN
    IF p_roll_id IS NULL THEN
        RETURN;
    END IF;

    SELECT area_m2, material_type, status
    INTO v_area, v_material_type, v_status
    FROM rolls
    WHERE id = p_roll_id;

    IF v_area IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(SUM((pr.width_mm::DECIMAL * pr.height_mm::DECIMAL) / 1000000.0), 0)
    INTO v_used_area
    FROM placed_rectangles pr
    WHERE pr.roll_id = p_roll_id;

    v_available_area := GREATEST(v_area - v_used_area, 0);

    UPDATE rolls
    SET used_area_m2 = v_used_area,
        available_area_m2 = v_available_area,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_roll_id;

    IF v_status <> 'ARCHIVED' THEN
        SELECT COUNT(*) INTO v_placement_count FROM placed_rectangles WHERE roll_id = p_roll_id;
        v_next_status := CASE WHEN v_placement_count > 0 THEN 'OPENED' ELSE 'AVAILABLE' END;

        SELECT min_width_mm, min_length_m
        INTO v_min_width_mm, v_min_length_m
        FROM material_chute_thresholds
        WHERE material_type = v_material_type;

        v_threshold_area := (COALESCE(v_min_width_mm, 0)::DECIMAL / 1000.0) * COALESCE(v_min_length_m, 0);

        IF v_available_area <= v_threshold_area THEN
            v_next_status := 'EXHAUSTED';
        END IF;

        UPDATE rolls SET status = v_next_status WHERE id = p_roll_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalc_waste_usage_and_status(p_waste_id UUID)
RETURNS VOID AS $$
DECLARE
    v_used_area DECIMAL(12,4);
    v_area DECIMAL(12,4);
    v_available_area DECIMAL(12,4);
    v_material_type VARCHAR(20);
    v_status VARCHAR(20);
    v_min_width_mm INTEGER;
    v_min_length_m DECIMAL(10,2);
    v_threshold_area DECIMAL(12,4);
    v_placement_count INTEGER;
    v_next_status VARCHAR(20);
BEGIN
    IF p_waste_id IS NULL THEN
        RETURN;
    END IF;

    SELECT area_m2, material_type, status
    INTO v_area, v_material_type, v_status
    FROM waste_pieces
    WHERE id = p_waste_id;

    IF v_area IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(SUM((pr.width_mm::DECIMAL * pr.height_mm::DECIMAL) / 1000000.0), 0)
    INTO v_used_area
    FROM placed_rectangles pr
    WHERE pr.waste_piece_id = p_waste_id;

    v_available_area := GREATEST(v_area - v_used_area, 0);

    UPDATE waste_pieces
    SET used_area_m2 = v_used_area,
        available_area_m2 = v_available_area,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_waste_id;

    IF v_status <> 'ARCHIVED' THEN
        SELECT COUNT(*) INTO v_placement_count FROM placed_rectangles WHERE waste_piece_id = p_waste_id;
        v_next_status := CASE WHEN v_placement_count > 0 THEN 'OPENED' ELSE 'AVAILABLE' END;

        SELECT min_width_mm, min_length_m
        INTO v_min_width_mm, v_min_length_m
        FROM material_chute_thresholds
        WHERE material_type = v_material_type;

        v_threshold_area := (COALESCE(v_min_width_mm, 0)::DECIMAL / 1000.0) * COALESCE(v_min_length_m, 0);

        IF v_available_area <= v_threshold_area THEN
            v_next_status := 'EXHAUSTED';
        END IF;

        UPDATE waste_pieces SET status = v_next_status WHERE id = p_waste_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_source_usage_from_placements()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM recalc_roll_usage_and_status(NEW.roll_id);
        PERFORM recalc_waste_usage_and_status(NEW.waste_piece_id);
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM recalc_roll_usage_and_status(NEW.roll_id);
        PERFORM recalc_waste_usage_and_status(NEW.waste_piece_id);
        IF NEW.roll_id IS DISTINCT FROM OLD.roll_id THEN
            PERFORM recalc_roll_usage_and_status(OLD.roll_id);
        END IF;
        IF NEW.waste_piece_id IS DISTINCT FROM OLD.waste_piece_id THEN
            PERFORM recalc_waste_usage_and_status(OLD.waste_piece_id);
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM recalc_roll_usage_and_status(OLD.roll_id);
        PERFORM recalc_waste_usage_and_status(OLD.waste_piece_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_placed_rectangles_usage_update ON placed_rectangles;
CREATE TRIGGER trigger_placed_rectangles_usage_update
AFTER INSERT OR UPDATE OR DELETE ON placed_rectangles
FOR EACH ROW EXECUTE FUNCTION update_source_usage_from_placements();

-- Backfill usage from existing placements
UPDATE rolls r
SET used_area_m2 = COALESCE((
        SELECT SUM((pr.width_mm::DECIMAL * pr.height_mm::DECIMAL) / 1000000.0)
        FROM placed_rectangles pr
        WHERE pr.roll_id = r.id
    ), 0),
    available_area_m2 = GREATEST(r.area_m2 - COALESCE((
        SELECT SUM((pr.width_mm::DECIMAL * pr.height_mm::DECIMAL) / 1000000.0)
        FROM placed_rectangles pr
        WHERE pr.roll_id = r.id
    ), 0), 0)
WHERE r.id IS NOT NULL;

UPDATE waste_pieces w
SET used_area_m2 = COALESCE((
        SELECT SUM((pr.width_mm::DECIMAL * pr.height_mm::DECIMAL) / 1000000.0)
        FROM placed_rectangles pr
        WHERE pr.waste_piece_id = w.id
    ), 0),
    available_area_m2 = GREATEST(w.area_m2 - COALESCE((
        SELECT SUM((pr.width_mm::DECIMAL * pr.height_mm::DECIMAL) / 1000000.0)
        FROM placed_rectangles pr
        WHERE pr.waste_piece_id = w.id
    ), 0), 0)
WHERE w.id IS NOT NULL;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM rolls LOOP
        PERFORM recalc_roll_usage_and_status(r.id);
    END LOOP;
    FOR r IN SELECT id FROM waste_pieces LOOP
        PERFORM recalc_waste_usage_and_status(r.id);
    END LOOP;
END $$;

-- ==========================================================================
-- End V31
-- ==========================================================================
