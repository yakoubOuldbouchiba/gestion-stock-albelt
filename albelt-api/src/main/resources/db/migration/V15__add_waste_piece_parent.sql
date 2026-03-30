-- ============================================================================
-- Migration V15: Add waste piece parent support
-- Description: Allow waste_pieces to reference parent waste_pieces and enforce area constraints
-- ============================================================================

ALTER TABLE waste_pieces
    ADD COLUMN IF NOT EXISTS parent_waste_piece_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_waste_piece_parent'
    ) THEN
        ALTER TABLE waste_pieces
            ADD CONSTRAINT fk_waste_piece_parent
            FOREIGN KEY (parent_waste_piece_id)
            REFERENCES waste_pieces(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_waste_pieces_parent_id
    ON waste_pieces(parent_waste_piece_id);

-- ============================================================================
-- TRIGGER: Validate waste_pieces dimensions <= corresponding parent dimensions
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_waste_piece_dimensions()
RETURNS TRIGGER AS $$
DECLARE
    source_roll RECORD;
    source_piece RECORD;
BEGIN
    IF NEW.parent_waste_piece_id IS NOT NULL THEN
        SELECT width_mm, length_m, area_m2, color_id INTO source_piece
        FROM waste_pieces
        WHERE id = NEW.parent_waste_piece_id;
    ELSE
        SELECT width_mm, length_m, area_m2, color_id INTO source_roll
        FROM rolls
        WHERE id = NEW.roll_id;
    END IF;

    IF source_piece IS NOT NULL THEN
        IF NEW.width_mm > source_piece.width_mm THEN
            RAISE EXCEPTION 'Waste piece width (% mm) cannot exceed parent waste piece width (% mm)',
                           NEW.width_mm, source_piece.width_mm;
        END IF;

        IF NEW.length_m > source_piece.length_m THEN
            RAISE EXCEPTION 'Waste piece length (% m) cannot exceed parent waste piece length (% m)',
                           NEW.length_m, source_piece.length_m;
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

        IF NEW.length_m > source_roll.length_m THEN
            RAISE EXCEPTION 'Waste piece length (% m) cannot exceed source roll length (% m)',
                           NEW.length_m, source_roll.length_m;
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS waste_piece_dimensions_check ON waste_pieces;
CREATE TRIGGER waste_piece_dimensions_check
BEFORE INSERT OR UPDATE ON waste_pieces
FOR EACH ROW
EXECUTE FUNCTION validate_waste_piece_dimensions();

-- ============================================================================
-- TRIGGER: Enforce sum of child areas <= parent area
-- ============================================================================
CREATE OR REPLACE FUNCTION enforce_waste_piece_child_area()
RETURNS TRIGGER AS $$
DECLARE
    parent_area DECIMAL(12,4);
    sibling_sum DECIMAL(12,4);
BEGIN
    IF NEW.parent_waste_piece_id IS NOT NULL THEN
        SELECT area_m2 INTO parent_area
        FROM waste_pieces
        WHERE id = NEW.parent_waste_piece_id;

        SELECT COALESCE(SUM(area_m2), 0) INTO sibling_sum
        FROM waste_pieces
        WHERE parent_waste_piece_id = NEW.parent_waste_piece_id
            AND (NEW.id IS NULL OR id <> NEW.id);
    ELSE
        SELECT area_m2 INTO parent_area
        FROM rolls
        WHERE id = NEW.roll_id;

        SELECT COALESCE(SUM(area_m2), 0) INTO sibling_sum
        FROM waste_pieces
        WHERE roll_id = NEW.roll_id
            AND parent_waste_piece_id IS NULL
            AND (NEW.id IS NULL OR id <> NEW.id);
    END IF;

    IF parent_area IS NOT NULL AND (sibling_sum + NEW.area_m2) > parent_area THEN
        RAISE EXCEPTION 'Total child waste area (%.4f m2) exceeds parent area (%.4f m2)',
                       sibling_sum + NEW.area_m2, parent_area;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS waste_piece_child_area_check ON waste_pieces;
CREATE TRIGGER waste_piece_child_area_check
BEFORE INSERT OR UPDATE ON waste_pieces
FOR EACH ROW
EXECUTE FUNCTION enforce_waste_piece_child_area();

-- ============================================================================
-- End V15
-- ============================================================================
