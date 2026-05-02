-- ============================================================================
-- Migration V7: Create Triggers and Functions
-- Date: 2026-03-27
-- Description: Automatic updates, validations, and business logic
-- ============================================================================

-- ============================================================================
-- Trigger Function: Auto-update timestamps
-- ============================================================================
CREATE
OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
:= CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Apply to all tables using idempotent DO blocks
DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_users_updated_at') THEN
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE
    ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_suppliers_updated_at') THEN
CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE
    ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_altier_updated_at') THEN
CREATE TRIGGER trigger_altier_updated_at
    BEFORE UPDATE
    ON altier
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_rolls_updated_at') THEN
CREATE TRIGGER trigger_rolls_updated_at
    BEFORE UPDATE
    ON rolls
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_waste_pieces_updated_at') THEN
CREATE TRIGGER trigger_waste_pieces_updated_at
    BEFORE UPDATE
    ON waste_pieces
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_clients_updated_at') THEN
CREATE TRIGGER trigger_clients_updated_at
    BEFORE UPDATE
    ON clients
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_client_phones_updated_at') THEN
CREATE TRIGGER trigger_client_phones_updated_at
    BEFORE UPDATE
    ON client_phones
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_client_emails_updated_at') THEN
CREATE TRIGGER trigger_client_emails_updated_at
    BEFORE UPDATE
    ON client_emails
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_client_addresses_updated_at') THEN
CREATE TRIGGER trigger_client_addresses_updated_at
    BEFORE UPDATE
    ON client_addresses
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_client_representatives_updated_at') THEN
CREATE TRIGGER trigger_client_representatives_updated_at
    BEFORE UPDATE
    ON client_representatives
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_commandes_updated_at') THEN
CREATE TRIGGER trigger_commandes_updated_at
    BEFORE UPDATE
    ON commandes
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_commande_items_updated_at') THEN
CREATE TRIGGER trigger_commande_items_updated_at
    BEFORE UPDATE
    ON commande_items
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_roll_movements_updated_at') THEN
CREATE TRIGGER trigger_roll_movements_updated_at
    BEFORE UPDATE
    ON roll_movements
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_transfer_bons_updated_at') THEN
CREATE TRIGGER trigger_transfer_bons_updated_at
    BEFORE UPDATE
    ON transfer_bons
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_material_chute_thresholds_updated_at') THEN
CREATE TRIGGER trigger_material_chute_thresholds_updated_at
    BEFORE UPDATE
    ON material_chute_thresholds
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
END IF;
END $$;

-- ============================================================================
-- Trigger Function: Calculate waste piece area
-- ============================================================================
CREATE
OR REPLACE FUNCTION calculate_waste_piece_area()
RETURNS TRIGGER AS $$
BEGIN
    NEW.area_m2
:= (NEW.width_mm::DECIMAL / 1000.0) * NEW.length_m;
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_waste_pieces_calculate_area') THEN
CREATE TRIGGER trigger_waste_pieces_calculate_area
    BEFORE INSERT OR
UPDATE ON waste_pieces FOR EACH ROW
    EXECUTE FUNCTION calculate_waste_piece_area();
END IF;
END $$;

-- ============================================================================
-- Trigger Function: Prevent supplier deletion with active rolls
-- ============================================================================
CREATE
OR REPLACE FUNCTION prevent_supplier_deletion()
RETURNS TRIGGER AS $$
DECLARE
v_count INTEGER;
BEGIN
    IF
TG_OP = 'DELETE' THEN
SELECT COUNT(*)
INTO v_count
FROM rolls
WHERE supplier_id = OLD.id
  AND status IN ('AVAILABLE', 'OPENED');

IF
v_count > 0 THEN
            RAISE EXCEPTION 'Cannot delete supplier (%) with % active rolls', 
                            OLD.name, v_count;
END IF;
END IF;

RETURN OLD;
END;
$$
LANGUAGE plpgsql;

DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_prevent_supplier_deletion') THEN
CREATE TRIGGER trigger_prevent_supplier_deletion
    BEFORE DELETE
    ON suppliers
    FOR EACH ROW EXECUTE FUNCTION prevent_supplier_deletion();
END IF;
END $$;

-- ============================================================================
-- Trigger Function: Auto-classify waste
-- ============================================================================
CREATE
OR REPLACE FUNCTION auto_classify_waste()
RETURNS TRIGGER AS $$
DECLARE
v_min_width_mm INTEGER;
    v_min_length_m
DECIMAL(10,2);
BEGIN
    -- Use material-specific thresholds from configuration
SELECT min_width_mm, min_length_m
INTO v_min_width_mm, v_min_length_m
FROM material_chute_thresholds
WHERE material_type = NEW.material_type;

v_min_width_mm
:= COALESCE(v_min_width_mm, 0);
    v_min_length_m
:= COALESCE(v_min_length_m, 0);

    IF
NEW.waste_type IS NULL OR NEW.waste_type = '' THEN
        IF NEW.width_mm >= v_min_width_mm AND NEW.length_m >= v_min_length_m THEN
            NEW.waste_type := 'CHUTE_EXPLOITABLE';
ELSE
            NEW.waste_type := 'DECHET';
END IF;
END IF;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_waste_auto_classify') THEN
CREATE TRIGGER trigger_waste_auto_classify
    BEFORE INSERT OR
UPDATE ON waste_pieces FOR EACH ROW
    EXECUTE FUNCTION auto_classify_waste();
END IF;
END $$;

-- ============================================================================
-- End V7: Triggers and Functions Created
-- ============================================================================
