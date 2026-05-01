-- ============================================================================
-- Migration V41: Add lot_id tracking for inventory items
-- Date: 2026-04-29
-- Description: Adds unique lot_id to rolls and waste_pieces tables
-- ============================================================================

-- 1. Add lot_id to rolls
ALTER TABLE rolls
    ADD COLUMN IF NOT EXISTS lot_id INTEGER;

-- 2. Backfill lot_id for existing rolls (ensuring uniqueness)
DO
$$
DECLARE
r RECORD;
    counter
INTEGER := 1000;
BEGIN
FOR r IN
SELECT id
FROM rolls
WHERE lot_id IS NULL
ORDER BY created_at ASC LOOP
UPDATE rolls
SET lot_id = counter
WHERE id = r.id;
counter
:= counter + 1;
END LOOP;
END $$;

-- 3. Enforce constraints on rolls
ALTER TABLE rolls
    ALTER COLUMN lot_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rolls_lot_id ON rolls(lot_id);

-- 4. Add lot_id to waste_pieces
ALTER TABLE waste_pieces
    ADD COLUMN IF NOT EXISTS lot_id INTEGER;

-- 5. Backfill lot_id for existing waste_pieces
DO
$$
DECLARE
r RECORD;
    counter
INTEGER := 5000;
BEGIN
FOR r IN
SELECT id
FROM waste_pieces
WHERE lot_id IS NULL
ORDER BY created_at ASC LOOP
UPDATE waste_pieces
SET lot_id = counter
WHERE id = r.id;
counter
:= counter + 1;
END LOOP;
END $$;

-- 6. Enforce constraints on waste_pieces
ALTER TABLE waste_pieces
    ALTER COLUMN lot_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_waste_pieces_lot_id ON waste_pieces(lot_id);

-- ============================================================================
-- End V41
-- ============================================================================
