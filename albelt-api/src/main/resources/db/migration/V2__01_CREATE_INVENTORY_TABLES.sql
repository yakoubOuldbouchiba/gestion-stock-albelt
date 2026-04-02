-- ============================================================================
-- Migration V2: Create Inventory Tables (ROLLS, WASTE_PIECES)
-- Date: 2026-03-27
-- Description: Stock inventory and waste management
-- ============================================================================

-- ============================================================================
-- COLORS Table (UI-configured color list)
-- ============================================================================
CREATE TABLE IF NOT EXISTS colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    hex_code VARCHAR(7) NOT NULL CHECK (hex_code ~ '^#[0-9A-Fa-f]{6}$'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ROLLS Table (Core Inventory - FIFO Based)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reception & Supplier Info
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,

    -- Material Specifications
    material_type VARCHAR(20) NOT NULL
        CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),
    nb_plis INTEGER NOT NULL DEFAULT 1 CHECK (nb_plis > 0),
    thickness_mm DECIMAL(8,3) NOT NULL CHECK (thickness_mm > 0),

    -- Dimensions
    width_mm INTEGER NOT NULL CHECK (width_mm > 0),
    width_remaining_mm INTEGER,
    length_m DECIMAL(10,2) NOT NULL CHECK (length_m > 0),
    length_remaining_m DECIMAL(10,2),
    area_m2 DECIMAL(12,4) NOT NULL CHECK (area_m2 > 0),

    -- Status & Classification
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED')),


    -- Location & Tracking
    altier_id UUID REFERENCES altier(id) ON DELETE SET NULL,
    qr_code VARCHAR(500),

    -- Processing tracking
    total_cuts INTEGER NOT NULL DEFAULT 0,
    total_waste_area_m2 DECIMAL(12,4) NOT NULL DEFAULT 0,
    last_processing_date TIMESTAMP,

    -- Audit
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WASTE_PIECES Table (Byproduct Reuse Tracking)
-- Same structure as rolls, with roll_id reference
-- ============================================================================
CREATE TABLE IF NOT EXISTS waste_pieces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source Reference (ONLY DIFFERENCE from rolls)
    roll_id UUID NOT NULL REFERENCES rolls(id) ON DELETE RESTRICT,
    parent_waste_piece_id UUID REFERENCES waste_pieces(id) ON DELETE SET NULL,

    -- Material Specifications (same as rolls)
    material_type VARCHAR(20) NOT NULL
        CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),
    nb_plis INTEGER NOT NULL DEFAULT 1 CHECK (nb_plis > 0),
    thickness_mm DECIMAL(8,3) NOT NULL CHECK (thickness_mm > 0),

    -- Dimensions (same as rolls)
    width_mm INTEGER NOT NULL CHECK (width_mm > 0),
    width_remaining_mm INTEGER,
    length_m DECIMAL(10,2) NOT NULL CHECK (length_m > 0),
    length_remaining_m DECIMAL(10,2),
    area_m2 DECIMAL(12,4) NOT NULL CHECK (area_m2 > 0),

    -- Status & Classification (same as rolls)
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED')),
    waste_type VARCHAR(50) NOT NULL DEFAULT 'DECHET'
        CHECK (waste_type IN ('CHUTE_EXPLOITABLE', 'DECHET')),

    -- Location & Tracking (same as rolls)
    altier_id UUID REFERENCES altier(id) ON DELETE SET NULL,
    qr_code VARCHAR(500),

    -- Processing tracking (same as rolls)
    total_cuts INTEGER NOT NULL DEFAULT 0,
    total_waste_area_m2 DECIMAL(12,4) NOT NULL DEFAULT 0,
    last_processing_date TIMESTAMP,

    -- Waste-specific tracking
    commande_item_id UUID,
    classification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Audit (same as rolls)
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================================
-- Alter tables: remove original_quantity and add color_id
-- ============================================================================
ALTER TABLE rolls
    DROP COLUMN IF EXISTS original_quantity,
    ADD COLUMN color_id UUID REFERENCES colors(id) ON DELETE SET NULL;

ALTER TABLE waste_pieces
    DROP COLUMN IF EXISTS original_quantity,
    ADD COLUMN color_id UUID REFERENCES colors(id) ON DELETE SET NULL;

-- ============================================================================
-- End V2: Inventory Tables Created
-- ============================================================================

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
        -- Fetch source roll dimensions
        SELECT width_mm, length_m, area_m2, color_id INTO source_roll
        FROM rolls
        WHERE id = NEW.roll_id;
    END IF;

    IF source_piece IS NOT NULL THEN
        -- Validate width doesn't exceed parent waste piece width
        IF NEW.width_mm > source_piece.width_mm THEN
            RAISE EXCEPTION 'Waste piece width (% mm) cannot exceed parent waste piece width (% mm)',
                           NEW.width_mm, source_piece.width_mm;
        END IF;

        -- Validate length doesn't exceed parent waste piece length
        IF NEW.length_m > source_piece.length_m THEN
            RAISE EXCEPTION 'Waste piece length (% m) cannot exceed parent waste piece length (% m)',
                           NEW.length_m, source_piece.length_m;
        END IF;

        -- Validate area doesn't exceed parent waste piece area
        IF NEW.area_m2 > source_piece.area_m2 THEN
            RAISE EXCEPTION 'Waste piece area (%.4f m²) cannot exceed parent waste piece area (%.4f m²)',
                           NEW.area_m2, source_piece.area_m2;
        END IF;

        -- Enforce same color as parent waste piece
        IF NEW.color_id IS NULL THEN
            NEW.color_id := source_piece.color_id;
        ELSIF NEW.color_id <> source_piece.color_id THEN
            RAISE EXCEPTION 'Waste piece color must match parent waste piece color';
        END IF;
    ELSIF source_roll IS NOT NULL THEN
        -- Validate width doesn't exceed source roll width
        IF NEW.width_mm > source_roll.width_mm THEN
            RAISE EXCEPTION 'Waste piece width (% mm) cannot exceed source roll width (% mm)',
                           NEW.width_mm, source_roll.width_mm;
        END IF;

        -- Validate length doesn't exceed source roll length
        IF NEW.length_m > source_roll.length_m THEN
            RAISE EXCEPTION 'Waste piece length (% m) cannot exceed source roll length (% m)',
                           NEW.length_m, source_roll.length_m;
        END IF;

        -- Validate area doesn't exceed source roll area
        IF NEW.area_m2 > source_roll.area_m2 THEN
            RAISE EXCEPTION 'Waste piece area (%.4f m²) cannot exceed source roll area (%.4f m²)',
                           NEW.area_m2, source_roll.area_m2;
        END IF;

        -- Enforce same color as parent roll
        IF NEW.color_id IS NULL THEN
            NEW.color_id := source_roll.color_id;
        ELSIF NEW.color_id <> source_roll.color_id THEN
            RAISE EXCEPTION 'Waste piece color must match parent roll color';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on waste_pieces INSERT and UPDATE
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
        RAISE EXCEPTION 'Total child waste area (%.4f m²) exceeds parent area (%.4f m²)',
                       sibling_sum + NEW.area_m2, parent_area;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on waste_pieces INSERT and UPDATE
CREATE TRIGGER waste_piece_child_area_check
BEFORE INSERT OR UPDATE ON waste_pieces
FOR EACH ROW
EXECUTE FUNCTION enforce_waste_piece_child_area();

-- ============================================================================
-- TRIGGER: Update roll's total waste area when waste_piece is added/updated
-- ============================================================================
CREATE OR REPLACE FUNCTION update_roll_waste_area()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Add the new waste piece area to the roll's total waste
        UPDATE rolls
        SET total_waste_area_m2 = total_waste_area_m2 + NEW.area_m2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.roll_id;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Adjust for the difference between old and new waste piece area
        UPDATE rolls
        SET total_waste_area_m2 = total_waste_area_m2 - OLD.area_m2 + NEW.area_m2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.roll_id;

    ELSIF TG_OP = 'DELETE' THEN
        -- Subtract the waste piece area from the roll's total waste
        UPDATE rolls
        SET total_waste_area_m2 = total_waste_area_m2 - OLD.area_m2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.roll_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update roll waste area on waste_pieces changes
CREATE TRIGGER waste_piece_area_update
AFTER INSERT OR UPDATE OR DELETE ON waste_pieces
FOR EACH ROW
EXECUTE FUNCTION update_roll_waste_area();

-- ============================================================================
