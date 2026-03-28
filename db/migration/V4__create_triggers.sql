-- ============================================================================
-- Flyway Migration V5: Create Automatic Triggers
-- Date: 2026-03-23
-- Description: Create triggers for automatic timestamp updates and audit logging
-- ============================================================================

-- ============================================================================
-- Trigger Function: Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_rolls_updated_at
BEFORE UPDATE ON rolls
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_waste_pieces_updated_at
BEFORE UPDATE ON waste_pieces
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- Trigger Function: Auto-calculate roll area
-- ============================================================================
-- NOTE: Rolls table provides area_initial_m2 explicitly during insert, so no trigger needed
-- The RollService and Roll entity handle automatic calculations via @PrePersist

-- ============================================================================
-- Trigger Function: Auto-calculate waste piece area
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_waste_piece_area()
RETURNS TRIGGER AS $$
BEGIN
    -- area_m2 = (width_mm / 1000) * length_m
    NEW.area_m2 := (NEW.width_mm::DECIMAL / 1000.0) * NEW.length_m;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_waste_pieces_calculate_area
BEFORE INSERT OR UPDATE ON waste_pieces
FOR EACH ROW
EXECUTE FUNCTION calculate_waste_piece_area();

-- Note: Audit logging moved to Spring AOP/Listeners (V3 removed AUDIT_LOG table)

-- ============================================================================
-- Trigger Function: Prevent supplier deletion with active rolls
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_supplier_deletion()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT COUNT(*) INTO v_count
        FROM rolls
        WHERE supplier_id = OLD.id
            AND status IN ('AVAILABLE', 'OPENED');
        
        IF v_count > 0 THEN
            RAISE EXCEPTION 'Cannot delete supplier (%) with % active rolls', 
                            OLD.name, v_count;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_supplier_deletion
BEFORE DELETE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION prevent_supplier_deletion();

-- ============================================================================
-- Trigger Function: Auto-flag waste for reuse (> 3000mm)
-- ============================================================================

CREATE OR REPLACE FUNCTION flag_waste_for_reuse()
RETURNS TRIGGER AS $$
BEGIN
    -- Waste pieces > 3000mm (3.0 m2) are automatically flagged as AVAILABLE
    -- Smaller pieces are marked as SCRAP
    IF (NEW.width_mm * 1.0 * NEW.length_m) > 3.0 THEN
        NEW.status := 'AVAILABLE';
        NEW.notes := COALESCE(NEW.notes, '') || ' [AUTO: Large waste - available for reuse]';
    ELSE
        NEW.status := 'SCRAP';
        NEW.notes := COALESCE(NEW.notes, '') || ' [AUTO: Small waste - marked for scrap]';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_waste_auto_categorize
BEFORE INSERT ON waste_pieces
FOR EACH ROW
EXECUTE FUNCTION flag_waste_for_reuse();

-- ============================================================================
-- End V5: Triggers Created
-- ============================================================================
