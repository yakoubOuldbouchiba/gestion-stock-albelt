-- ============================================================================
-- Migration V18: Create Production Items (Order Line Outputs)
-- Date: 2026-04-02
-- Description: Track production items per commande_items with roll/chute usage
-- ============================================================================

-- ============================================================================
-- PRODUCTION_ITEMS Table (Order Line Outputs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_items
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    commande_item_id UUID NOT NULL REFERENCES commande_items
(
    id
) ON DELETE CASCADE,

    -- Source Material (exactly one)
    roll_id UUID REFERENCES rolls
(
    id
)
  ON DELETE RESTRICT,
    waste_piece_id UUID REFERENCES waste_pieces
(
    id
)
  ON DELETE RESTRICT,

    -- Dimensions (per piece)
    piece_length_m DECIMAL
(
    10,
    2
) NOT NULL CHECK
(
    piece_length_m >
    0
),
    piece_width_mm INTEGER NOT NULL CHECK
(
    piece_width_mm >
    0
),

    -- Quantity
    quantity INTEGER NOT NULL DEFAULT 1 CHECK
(
    quantity >
    0
),

    -- Area (calculated)
    area_per_piece_m2 DECIMAL
(
    12,
    4
) NOT NULL CHECK
(
    area_per_piece_m2 >
    0
),
    total_area_m2 DECIMAL
(
    12,
    4
) NOT NULL CHECK
(
    total_area_m2 >
    0
),

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT production_items_single_source CHECK
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

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_production_items_commande_item_id ON production_items(commande_item_id);
CREATE INDEX IF NOT EXISTS idx_production_items_roll_id ON production_items(roll_id);
CREATE INDEX IF NOT EXISTS idx_production_items_waste_piece_id ON production_items(waste_piece_id);

-- ============================================================================
-- Trigger Function: Calculate production item area
-- ============================================================================
CREATE
OR REPLACE FUNCTION calculate_production_item_area()
RETURNS TRIGGER AS $$
BEGIN
    NEW.area_per_piece_m2
:= (NEW.piece_width_mm::DECIMAL / 1000.0) * NEW.piece_length_m;
    NEW.total_area_m2
:= NEW.area_per_piece_m2 * NEW.quantity;
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_production_items_calculate_area') THEN
CREATE TRIGGER trigger_production_items_calculate_area
    BEFORE INSERT OR
UPDATE ON production_items
    FOR EACH ROW EXECUTE FUNCTION calculate_production_item_area();
END IF;
END $$;

-- ============================================================================
-- Trigger Function: Enforce production item area <= source area
-- ============================================================================
CREATE
OR REPLACE FUNCTION enforce_production_item_area()
RETURNS TRIGGER AS $$
DECLARE
source_area DECIMAL(12,4);
    sibling_sum
DECIMAL(12,4);
BEGIN
    IF
NEW.roll_id IS NOT NULL THEN
SELECT area_m2
INTO source_area
FROM rolls
WHERE id = NEW.roll_id;

SELECT COALESCE(SUM(total_area_m2), 0)
INTO sibling_sum
FROM production_items
WHERE roll_id = NEW.roll_id
  AND (NEW.id IS NULL OR id <> NEW.id);
ELSE
SELECT area_m2
INTO source_area
FROM waste_pieces
WHERE id = NEW.waste_piece_id;

SELECT COALESCE(SUM(total_area_m2), 0)
INTO sibling_sum
FROM production_items
WHERE waste_piece_id = NEW.waste_piece_id
  AND (NEW.id IS NULL OR id <> NEW.id);
END IF;

    IF
source_area IS NOT NULL AND (sibling_sum + NEW.total_area_m2) > source_area THEN
        RAISE EXCEPTION 'Total production area (%.4f m2) exceeds source area (%.4f m2)',
                       sibling_sum + NEW.total_area_m2, source_area;
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
END $$;

-- ============================================================================
-- Trigger Function: Enforce production item quantity <= commande_items.quantite
-- ============================================================================
CREATE
OR REPLACE FUNCTION enforce_production_item_quantity()
RETURNS TRIGGER AS $$
DECLARE
item_quantity INTEGER;
    sibling_sum
INTEGER;
BEGIN
SELECT quantite
INTO item_quantity
FROM commande_items
WHERE id = NEW.commande_item_id;

SELECT COALESCE(SUM(quantity), 0)
INTO sibling_sum
FROM production_items
WHERE commande_item_id = NEW.commande_item_id
  AND (NEW.id IS NULL OR id <> NEW.id);

IF
item_quantity IS NOT NULL AND (sibling_sum + NEW.quantity) > item_quantity THEN
        RAISE EXCEPTION 'Total production quantity (%) exceeds commande item quantity (%)',
                       sibling_sum + NEW.quantity, item_quantity;
END IF;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_production_items_validate_quantity') THEN
CREATE TRIGGER trigger_production_items_validate_quantity
    BEFORE INSERT OR
UPDATE ON production_items
    FOR EACH ROW EXECUTE FUNCTION enforce_production_item_quantity();
END IF;
END $$;

-- ============================================================================
-- Trigger: Auto-update timestamps
-- ============================================================================
DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_production_items_updated_at') THEN
CREATE TRIGGER trigger_production_items_updated_at
    BEFORE UPDATE
    ON production_items
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
END $$;

-- ============================================================================
-- End V18: Production Items Created
-- ============================================================================
