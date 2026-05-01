-- ============================================================================
-- Migration V27: Link production_items to placed_rectangles
-- Date: 2026-04-05
-- Description: Replace roll/waste/commande references with placed_rectangle_id
-- ============================================================================

-- Drop validation triggers that rely on removed columns
DO
$$
BEGIN
    IF
EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_production_items_validate_area') THEN
DROP TRIGGER trigger_production_items_validate_area ON production_items;
END IF;
    IF
EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_production_items_validate_quantity') THEN
DROP TRIGGER trigger_production_items_validate_quantity ON production_items;
END IF;
END $$;

-- Update schema
ALTER TABLE production_items
DROP
CONSTRAINT IF EXISTS production_items_single_source;

DROP INDEX IF EXISTS idx_production_items_commande_item_id;
DROP INDEX IF EXISTS idx_production_items_roll_id;
DROP INDEX IF EXISTS idx_production_items_waste_piece_id;

ALTER TABLE production_items
DROP
COLUMN IF EXISTS commande_item_id,
    DROP
COLUMN IF EXISTS roll_id,
    DROP
COLUMN IF EXISTS waste_piece_id;

ALTER TABLE production_items
    ADD COLUMN placed_rectangle_id UUID NOT NULL REFERENCES placed_rectangles (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_production_items_placed_rectangle_id ON production_items(placed_rectangle_id);

-- ============================================================================
-- Trigger Function: Enforce production item area <= placed rectangle area
-- ============================================================================
CREATE
OR REPLACE FUNCTION enforce_production_item_area()
RETURNS TRIGGER AS $$
DECLARE
rect_area DECIMAL(12,4);
    sibling_sum
DECIMAL(12,4);
BEGIN
SELECT (width_mm::DECIMAL / 1000.0) * (height_mm::DECIMAL / 1000.0)
INTO rect_area
FROM placed_rectangles
WHERE id = NEW.placed_rectangle_id;

SELECT COALESCE(SUM(total_area_m2), 0)
INTO sibling_sum
FROM production_items
WHERE placed_rectangle_id = NEW.placed_rectangle_id
  AND (NEW.id IS NULL OR id <> NEW.id);

IF
rect_area IS NOT NULL AND (sibling_sum + NEW.total_area_m2) > rect_area THEN
        RAISE EXCEPTION 'Total production area (%.4f m2) exceeds placed rectangle area (%.4f m2)',
                       sibling_sum + NEW.total_area_m2, rect_area;
END IF;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- ============================================================================
-- Trigger Function: Enforce production item quantity <= commande_items.quantite
-- ============================================================================
CREATE
OR REPLACE FUNCTION enforce_production_item_quantity()
RETURNS TRIGGER AS $$
DECLARE
item_id UUID;
    item_quantity
INTEGER;
    sibling_sum
INTEGER;
BEGIN
SELECT commande_item_id
INTO item_id
FROM placed_rectangles
WHERE id = NEW.placed_rectangle_id;

IF
item_id IS NULL THEN
        RETURN NEW;
END IF;

SELECT quantite
INTO item_quantity
FROM commande_items
WHERE id = item_id;

SELECT COALESCE(SUM(pi.quantity), 0)
INTO sibling_sum
FROM production_items pi
         JOIN placed_rectangles pr ON pr.id = pi.placed_rectangle_id
WHERE pr.commande_item_id = item_id
  AND (NEW.id IS NULL OR pi.id <> NEW.id);

IF
item_quantity IS NOT NULL AND (sibling_sum + NEW.quantity) > item_quantity THEN
        RAISE EXCEPTION 'Total production quantity (%) exceeds commande item quantity (%)',
                       sibling_sum + NEW.quantity, item_quantity;
END IF;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- ============================================================================
-- Trigger Function: Enforce production item dimensions <= placed rectangle
-- ============================================================================
CREATE
OR REPLACE FUNCTION enforce_production_item_dimensions()
RETURNS TRIGGER AS $$
DECLARE
rect_width INTEGER;
    rect_height
INTEGER;
    length_mm
DECIMAL(12,4);
BEGIN
SELECT width_mm, height_mm
INTO rect_width, rect_height
FROM placed_rectangles
WHERE id = NEW.placed_rectangle_id;

IF
rect_width IS NULL OR rect_height IS NULL THEN
        RETURN NEW;
END IF;

    length_mm
:= NEW.piece_length_m * 1000;

    IF
NEW.piece_width_mm > rect_width THEN
        RAISE EXCEPTION 'Piece width (% mm) exceeds placed rectangle width (% mm)',
                       NEW.piece_width_mm, rect_width;
END IF;

    IF
length_mm > rect_height THEN
        RAISE EXCEPTION 'Piece length (% mm) exceeds placed rectangle length (% mm)',
                       length_mm, rect_height;
END IF;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_production_items_validate_area') THEN
CREATE TRIGGER trigger_production_items_validate_area
    BEFORE INSERT OR
UPDATE ON production_items
    FOR EACH ROW EXECUTE FUNCTION enforce_production_item_area();
END IF;

    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_production_items_validate_quantity') THEN
CREATE TRIGGER trigger_production_items_validate_quantity
    BEFORE INSERT OR
UPDATE ON production_items
    FOR EACH ROW EXECUTE FUNCTION enforce_production_item_quantity();
END IF;

    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_production_items_validate_dimensions') THEN
CREATE TRIGGER trigger_production_items_validate_dimensions
    BEFORE INSERT OR
UPDATE ON production_items
    FOR EACH ROW EXECUTE FUNCTION enforce_production_item_dimensions();
END IF;
END $$;

-- ============================================================================
-- End V27
-- ============================================================================
