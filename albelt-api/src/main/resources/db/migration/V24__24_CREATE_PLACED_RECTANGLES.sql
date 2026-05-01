-- ============================================================================
-- Migration V24: Create Placed Rectangles
-- Date: 2026-04-04
-- Description: Track cut placements for roll/waste SVG layouts
-- ============================================================================

CREATE TABLE IF NOT EXISTS placed_rectangles
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    roll_id UUID REFERENCES rolls
(
    id
) ON DELETE CASCADE,
    waste_piece_id UUID REFERENCES waste_pieces
(
    id
)
  ON DELETE CASCADE,
    commande_item_id UUID REFERENCES commande_items
(
    id
)
  ON DELETE SET NULL,
    color_id UUID REFERENCES colors
(
    id
)
  ON DELETE SET NULL,

    x_mm INTEGER NOT NULL CHECK
(
    x_mm
    >=
    0
),
    y_mm INTEGER NOT NULL CHECK
(
    y_mm
    >=
    0
),
    width_mm INTEGER NOT NULL CHECK
(
    width_mm >
    0
),
    height_mm INTEGER NOT NULL CHECK
(
    height_mm >
    0
),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT placed_rectangles_single_source CHECK
(
(
    roll_id
    IS
    NOT
    NULL
    AND
    waste_piece_id
    IS
    NULL
)
    OR
(
    roll_id
    IS
    NULL
    AND
    waste_piece_id
    IS
    NOT
    NULL
)
    )
    );

CREATE INDEX IF NOT EXISTS idx_placed_rectangles_roll_id ON placed_rectangles(roll_id);
CREATE INDEX IF NOT EXISTS idx_placed_rectangles_waste_piece_id ON placed_rectangles(waste_piece_id);
CREATE INDEX IF NOT EXISTS idx_placed_rectangles_commande_item_id ON placed_rectangles(commande_item_id);
CREATE INDEX IF NOT EXISTS idx_placed_rectangles_color_id ON placed_rectangles(color_id);

-- ============================================================================
-- Trigger: Validate placed rectangle bounds within source dimensions
-- ============================================================================
CREATE
OR REPLACE FUNCTION validate_placed_rectangle_bounds()
RETURNS TRIGGER AS $$
DECLARE
source_width_mm INTEGER;
    source_length_m
DECIMAL(10,2);
    max_length_mm
DECIMAL(12,4);
BEGIN
    IF
NEW.roll_id IS NOT NULL THEN
SELECT width_mm, length_m
INTO source_width_mm, source_length_m
FROM rolls
WHERE id = NEW.roll_id;
ELSE
SELECT width_mm, length_m
INTO source_width_mm, source_length_m
FROM waste_pieces
WHERE id = NEW.waste_piece_id;
END IF;

    IF
source_width_mm IS NULL OR source_length_m IS NULL THEN
        RETURN NEW;
END IF;

    max_length_mm
:= source_length_m * 1000;

    IF
NEW.x_mm >= source_width_mm THEN
        RAISE EXCEPTION 'Placed rectangle x (% mm) must be < source width (% mm)', NEW.x_mm, source_width_mm;
END IF;

    IF
NEW.y_mm >= max_length_mm THEN
        RAISE EXCEPTION 'Placed rectangle y (% mm) must be < source length (% mm)', NEW.y_mm, max_length_mm;
END IF;

    IF
NEW.x_mm + NEW.width_mm > source_width_mm THEN
        RAISE EXCEPTION 'Placed rectangle width (% mm) exceeds source width (% mm)', NEW.x_mm + NEW.width_mm, source_width_mm;
END IF;

    IF
NEW.y_mm + NEW.height_mm > max_length_mm THEN
        RAISE EXCEPTION 'Placed rectangle height (% mm) exceeds source length (% mm)', NEW.y_mm + NEW.height_mm, max_length_mm;
END IF;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_placed_rectangle_bounds') THEN
CREATE TRIGGER trigger_placed_rectangle_bounds
    BEFORE INSERT OR
UPDATE ON placed_rectangles
    FOR EACH ROW EXECUTE FUNCTION validate_placed_rectangle_bounds();
END IF;
END $$;

-- ============================================================================
-- Trigger: Auto-update timestamps
-- ============================================================================
DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_placed_rectangles_updated_at') THEN
CREATE TRIGGER trigger_placed_rectangles_updated_at
    BEFORE UPDATE
    ON placed_rectangles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
END $$;

-- ============================================================================
-- End V24
-- ============================================================================
