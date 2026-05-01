-- ============================================================================
-- Migration V23: Add production totals to commande_items
-- Date: 2026-04-03
-- Description: Track conforming/non-conforming production quantities per item
-- ============================================================================

ALTER TABLE commande_items
    ADD COLUMN IF NOT EXISTS total_items_conforme INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_items_non_conforme INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- Helper: Refresh totals for a commande item
-- ============================================================================
CREATE
OR REPLACE FUNCTION refresh_commande_item_production_totals(target_id UUID)
RETURNS VOID AS $$
BEGIN
    IF
target_id IS NULL THEN
        RETURN;
END IF;

UPDATE commande_items
SET total_items_conforme     = COALESCE((SELECT SUM(quantity)
                                         FROM production_items
                                         WHERE commande_item_id = target_id
                                           AND good_production IS TRUE), 0),
    total_items_non_conforme = COALESCE((SELECT SUM(quantity)
                                         FROM production_items
                                         WHERE commande_item_id = target_id
                                           AND good_production IS FALSE), 0)
WHERE id = target_id;
END;
$$
LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Keep totals in sync on production_items changes
-- ============================================================================
CREATE
OR REPLACE FUNCTION trigger_refresh_commande_item_production_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF
TG_OP = 'DELETE' THEN
        PERFORM refresh_commande_item_production_totals(OLD.commande_item_id);
RETURN OLD;
ELSIF
TG_OP = 'UPDATE' THEN
        PERFORM refresh_commande_item_production_totals(NEW.commande_item_id);
        IF
NEW.commande_item_id IS DISTINCT FROM OLD.commande_item_id THEN
            PERFORM refresh_commande_item_production_totals(OLD.commande_item_id);
END IF;
RETURN NEW;
END IF;

    PERFORM
refresh_commande_item_production_totals(NEW.commande_item_id);
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1
        FROM information_schema.triggers
        WHERE trigger_name = 'trigger_refresh_commande_item_production_totals'
    ) THEN
CREATE TRIGGER trigger_refresh_commande_item_production_totals
    AFTER INSERT OR
UPDATE OR
DELETE
ON production_items
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_commande_item_production_totals();
END IF;
END $$;

-- ============================================================================
-- Backfill existing data
-- ============================================================================
UPDATE commande_items ci
SET total_items_conforme     = COALESCE((SELECT SUM(pi.quantity)
                                         FROM production_items pi
                                         WHERE pi.commande_item_id = ci.id
                                           AND pi.good_production IS TRUE), 0),
    total_items_non_conforme = COALESCE((SELECT SUM(pi.quantity)
                                         FROM production_items pi
                                         WHERE pi.commande_item_id = ci.id
                                           AND pi.good_production IS FALSE), 0);

-- ============================================================================
-- End V23
-- ============================================================================
