-- Migrate all dimension fields from mixed units to millimeters only
-- This handles Roll, WastePiece, and other entities storing length in meters

-- ============================================================================
-- Drop triggers and functions that reference length_m before migration
-- ============================================================================
DROP TRIGGER IF EXISTS waste_piece_dimensions_check ON waste_pieces;
DROP TRIGGER IF EXISTS trigger_waste_pieces_calculate_area ON waste_pieces;
DROP FUNCTION IF EXISTS calculate_waste_piece_area();

-- Rolls table: length_m -> length_mm
ALTER TABLE rolls ADD COLUMN length_mm INTEGER;
UPDATE rolls SET length_mm = CAST(CAST(length_m * 1000 AS INTEGER) AS INTEGER) WHERE length_m IS NOT NULL;
ALTER TABLE rolls ALTER COLUMN length_mm SET NOT NULL;
ALTER TABLE rolls ADD CONSTRAINT check_rolls_length_mm CHECK (length_mm > 0);
ALTER TABLE rolls DROP COLUMN length_m;

-- Rolls table: length_remaining_m -> length_remaining_mm
ALTER TABLE rolls ADD COLUMN length_remaining_mm INTEGER;
UPDATE rolls SET length_remaining_mm = CAST(CAST(length_remaining_m * 1000 AS INTEGER) AS INTEGER) WHERE length_remaining_m IS NOT NULL;
ALTER TABLE rolls DROP COLUMN length_remaining_m;

-- WastePieces table: length_m -> length_mm
ALTER TABLE waste_pieces ADD COLUMN length_mm INTEGER;
UPDATE waste_pieces SET length_mm = CAST(CAST(length_m * 1000 AS INTEGER) AS INTEGER) WHERE length_m IS NOT NULL;
ALTER TABLE waste_pieces ALTER COLUMN length_mm SET NOT NULL;
ALTER TABLE waste_pieces ADD CONSTRAINT check_waste_pieces_length_mm CHECK (length_mm > 0);
ALTER TABLE waste_pieces DROP COLUMN length_m;

-- WastePieces table: length_remaining_m -> length_remaining_mm
ALTER TABLE waste_pieces ADD COLUMN length_remaining_mm INTEGER;
UPDATE waste_pieces SET length_remaining_mm = CAST(CAST(length_remaining_m * 1000 AS INTEGER) AS INTEGER) WHERE length_remaining_m IS NOT NULL;
ALTER TABLE waste_pieces DROP COLUMN length_remaining_m;

-- Return Bon Items table: adjusted_length_m -> adjusted_length_mm
ALTER TABLE return_bon_items ADD COLUMN adjusted_length_mm INTEGER;
UPDATE return_bon_items SET adjusted_length_mm = CAST(CAST(adjusted_length_m * 1000 AS INTEGER) AS INTEGER) WHERE adjusted_length_m IS NOT NULL;
ALTER TABLE return_bon_items DROP COLUMN adjusted_length_m;

-- ============================================================================
-- Recreate trigger with new column names (length_m -> length_mm)
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_waste_piece_dimensions()
RETURNS TRIGGER AS $$
DECLARE
    source_roll RECORD;
    source_piece RECORD;
BEGIN
    IF NEW.parent_waste_piece_id IS NOT NULL THEN
        SELECT width_mm, length_mm, area_m2, color_id
        INTO source_piece
        FROM waste_pieces
        WHERE id = NEW.parent_waste_piece_id;
    ELSE
        SELECT width_mm, length_mm, area_m2, color_id
        INTO source_roll
        FROM rolls
        WHERE id = NEW.roll_id;
    END IF;

    IF source_piece IS NOT NULL THEN
        IF NEW.width_mm > source_piece.width_mm THEN
            RAISE EXCEPTION 'Waste piece width (% mm) cannot exceed parent waste piece width (% mm)',
                           NEW.width_mm, source_piece.width_mm;
        END IF;

        IF NEW.length_mm > source_piece.length_mm THEN
            RAISE EXCEPTION 'Waste piece length (% mm) cannot exceed parent waste piece length (% mm)',
                           NEW.length_mm, source_piece.length_mm;
        END IF;

        IF NEW.area_m2 > source_piece.area_m2 THEN
            RAISE EXCEPTION 'Waste piece area (%.4f m2) cannot exceed parent waste piece area (%.4f m2)',
                           NEW.area_m2, source_piece.area_m2;
        END IF;

        IF NEW.color_id IS NULL THEN
            NEW.color_id := source_piece.color_id;
        ELSIF NEW.color_id <> source_piece.color_id THEN
            RAISE EXCEPTION 'Waste piece color must match parent waste piece color';
        END IF;
    ELSIF source_roll IS NOT NULL THEN
        IF NEW.width_mm > source_roll.width_mm THEN
            RAISE EXCEPTION 'Waste piece width (% mm) cannot exceed source roll width (% mm)',
                           NEW.width_mm, source_roll.width_mm;
        END IF;

        IF NEW.length_mm > source_roll.length_mm THEN
            RAISE EXCEPTION 'Waste piece length (% mm) cannot exceed source roll length (% mm)',
                           NEW.length_mm, source_roll.length_mm;
        END IF;

        IF NEW.area_m2 > source_roll.area_m2 THEN
            RAISE EXCEPTION 'Waste piece area (%.4f m2) cannot exceed source roll area (%.4f m2)',
                           NEW.area_m2, source_roll.area_m2;
        END IF;

        IF NEW.color_id IS NULL THEN
            NEW.color_id := source_roll.color_id;
        ELSIF NEW.color_id <> source_roll.color_id THEN
            RAISE EXCEPTION 'Waste piece color must match parent roll color';
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER waste_piece_dimensions_check
    BEFORE INSERT OR UPDATE ON waste_pieces
    FOR EACH ROW
    EXECUTE FUNCTION validate_waste_piece_dimensions();

-- ============================================================================
-- Recreate trigger to calculate waste piece area with new length_mm column
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_waste_piece_area()
RETURNS TRIGGER AS $$
BEGIN
    NEW.area_m2 := (NEW.width_mm::DECIMAL / 1000.0) * (NEW.length_mm::DECIMAL / 1000.0);
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_waste_pieces_calculate_area
    BEFORE INSERT OR UPDATE ON waste_pieces
    FOR EACH ROW
    EXECUTE FUNCTION calculate_waste_piece_area();
