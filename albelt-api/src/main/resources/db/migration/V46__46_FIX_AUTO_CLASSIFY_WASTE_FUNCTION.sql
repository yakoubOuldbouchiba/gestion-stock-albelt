-- ============================================================================
-- V46: Fix auto_classify_waste() Function to Use Millimeter Columns
-- ============================================================================
-- Description: Update auto_classify_waste() trigger function to use length_mm and min_length_mm
--              This function was broken after V42-V45 migrations converted dimensions to millimeters
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_classify_waste()
RETURNS TRIGGER AS $$
DECLARE
    v_min_width_mm INTEGER;
    v_min_length_mm INTEGER;
BEGIN
    -- Use material-specific thresholds from configuration (now in millimeters)
    SELECT min_width_mm, min_length_mm
    INTO v_min_width_mm, v_min_length_mm
    FROM material_chute_thresholds
    WHERE material_type = NEW.material_type;

    v_min_width_mm := COALESCE(v_min_width_mm, 0);
    v_min_length_mm := COALESCE(v_min_length_mm, 0);

    -- Classify waste based on dimensions in millimeters
    IF NEW.waste_type IS NULL OR NEW.waste_type = '' THEN
        IF NEW.width_mm >= v_min_width_mm AND NEW.length_mm >= v_min_length_mm THEN
            NEW.waste_type := 'CHUTE_EXPLOITABLE';
        ELSE
            NEW.waste_type := 'DECHET';
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Recreate trigger with updated function
DROP TRIGGER IF EXISTS trigger_waste_auto_classify ON waste_pieces;

CREATE TRIGGER trigger_waste_auto_classify
    BEFORE INSERT OR UPDATE ON waste_pieces
    FOR EACH ROW
    EXECUTE FUNCTION auto_classify_waste();

-- ============================================================================
-- End V46: Fixed auto_classify_waste() to use millimeter columns
-- ============================================================================
