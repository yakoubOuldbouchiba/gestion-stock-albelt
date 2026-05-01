-- ============================================================================
-- TRIGGER: Update parent waste_piece's total waste area when child waste_piece is added/updated
-- ============================================================================
CREATE
OR REPLACE FUNCTION update_waste_piece_waste_area()
RETURNS TRIGGER AS $$
BEGIN
    IF
TG_OP = 'INSERT' THEN
        -- Add the new waste piece area to the parent waste piece's total waste
UPDATE waste_pieces
SET total_waste_area_m2 = COALESCE(total_waste_area_m2, 0) + NEW.area_m2,
    updated_at          = CURRENT_TIMESTAMP
WHERE id = NEW.parent_waste_piece_id;

ELSIF
TG_OP = 'UPDATE' THEN
        -- Adjust for the difference between old and new waste piece area
UPDATE waste_pieces
SET total_waste_area_m2 = COALESCE(total_waste_area_m2, 0) - OLD.area_m2 + NEW.area_m2,
    updated_at          = CURRENT_TIMESTAMP
WHERE id = NEW.parent_waste_piece_id;

ELSIF
TG_OP = 'DELETE' THEN
        -- Subtract the waste piece area from the parent waste piece's total waste
UPDATE waste_pieces
SET total_waste_area_m2 = COALESCE(total_waste_area_m2, 0) - OLD.area_m2,
    updated_at          = CURRENT_TIMESTAMP
WHERE id = OLD.parent_waste_piece_id;
END IF;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Create trigger to update parent waste_piece waste area on child waste_pieces changes
CREATE TRIGGER waste_piece_child_area_update
    AFTER INSERT OR
UPDATE OR
DELETE
ON waste_pieces
    FOR EACH ROW
    EXECUTE FUNCTION update_waste_piece_waste_area();

-- ============================================================================