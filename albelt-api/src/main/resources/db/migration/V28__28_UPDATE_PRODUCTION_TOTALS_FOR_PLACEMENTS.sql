-- ============================================================================
-- Migration V28: Update production totals to use placed_rectangles
-- Date: 2026-04-05
-- Description: Compute commande_items totals via placed_rectangles
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
SET total_items_conforme     = COALESCE((SELECT SUM(pi.quantity)
                                         FROM production_items pi
                                                  JOIN placed_rectangles pr ON pr.id = pi.placed_rectangle_id
                                         WHERE pr.commande_item_id = target_id
                                           AND pi.good_production IS TRUE), 0),
    total_items_non_conforme = COALESCE((SELECT SUM(pi.quantity)
                                         FROM production_items pi
                                                  JOIN placed_rectangles pr ON pr.id = pi.placed_rectangle_id
                                         WHERE pr.commande_item_id = target_id
                                           AND pi.good_production IS FALSE), 0)
WHERE id = target_id;
END;
$$
LANGUAGE plpgsql;

CREATE
OR REPLACE FUNCTION trigger_refresh_commande_item_production_totals()
RETURNS TRIGGER AS $$
DECLARE
target_id UUID;
BEGIN
    IF
TG_OP = 'DELETE' THEN
SELECT commande_item_id
INTO target_id
FROM placed_rectangles
WHERE id = OLD.placed_rectangle_id;
PERFORM
refresh_commande_item_production_totals(target_id);
RETURN OLD;
ELSIF
TG_OP = 'UPDATE' THEN
SELECT commande_item_id
INTO target_id
FROM placed_rectangles
WHERE id = NEW.placed_rectangle_id;
PERFORM
refresh_commande_item_production_totals(target_id);
        IF
NEW.placed_rectangle_id IS DISTINCT FROM OLD.placed_rectangle_id THEN
SELECT commande_item_id
INTO target_id
FROM placed_rectangles
WHERE id = OLD.placed_rectangle_id;
PERFORM
refresh_commande_item_production_totals(target_id);
END IF;
RETURN NEW;
END IF;

SELECT commande_item_id
INTO target_id
FROM placed_rectangles
WHERE id = NEW.placed_rectangle_id;
PERFORM
refresh_commande_item_production_totals(target_id);
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

-- Backfill existing data
UPDATE commande_items ci
SET total_items_conforme     = COALESCE((SELECT SUM(pi.quantity)
                                         FROM production_items pi
                                                  JOIN placed_rectangles pr ON pr.id = pi.placed_rectangle_id
                                         WHERE pr.commande_item_id = ci.id
                                           AND pi.good_production IS TRUE), 0),
    total_items_non_conforme = COALESCE((SELECT SUM(pi.quantity)
                                         FROM production_items pi
                                                  JOIN placed_rectangles pr ON pr.id = pi.placed_rectangle_id
                                         WHERE pr.commande_item_id = ci.id
                                           AND pi.good_production IS FALSE), 0);

-- ============================================================================
-- End V28
-- ============================================================================
