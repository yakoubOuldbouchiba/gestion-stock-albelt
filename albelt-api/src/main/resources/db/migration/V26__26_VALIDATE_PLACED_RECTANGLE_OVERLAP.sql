-- ============================================================================
-- Migration V26: Validate placed rectangle overlaps
-- Date: 2026-04-04
-- Description: Prevent overlapping placements on the same roll or waste piece
-- ============================================================================

CREATE
OR REPLACE FUNCTION validate_placed_rectangle_overlap()
RETURNS TRIGGER AS $$
DECLARE
overlap_count INTEGER;
BEGIN
    IF
NEW.roll_id IS NOT NULL THEN
SELECT COUNT(1)
INTO overlap_count
FROM placed_rectangles
WHERE roll_id = NEW.roll_id
  AND (NEW.id IS NULL OR id <> NEW.id)
  AND NEW.x_mm < (x_mm + width_mm)
  AND (NEW.x_mm + NEW.width_mm) > x_mm
  AND NEW.y_mm < (y_mm + height_mm)
  AND (NEW.y_mm + NEW.height_mm) > y_mm;
ELSE
SELECT COUNT(1)
INTO overlap_count
FROM placed_rectangles
WHERE waste_piece_id = NEW.waste_piece_id
  AND (NEW.id IS NULL OR id <> NEW.id)
  AND NEW.x_mm < (x_mm + width_mm)
  AND (NEW.x_mm + NEW.width_mm) > x_mm
  AND NEW.y_mm < (y_mm + height_mm)
  AND (NEW.y_mm + NEW.height_mm) > y_mm;
END IF;

    IF
overlap_count > 0 THEN
        RAISE EXCEPTION 'Placed rectangle overlaps an existing rectangle';
END IF;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_placed_rectangle_overlap') THEN
CREATE TRIGGER trigger_placed_rectangle_overlap
    BEFORE INSERT OR
UPDATE ON placed_rectangles
    FOR EACH ROW EXECUTE FUNCTION validate_placed_rectangle_overlap();
END IF;
END $$;

-- ============================================================================
-- End V26
-- ============================================================================
