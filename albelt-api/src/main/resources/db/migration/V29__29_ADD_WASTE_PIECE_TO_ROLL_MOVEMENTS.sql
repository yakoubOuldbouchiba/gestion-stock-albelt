-- ============================================================================
-- Migration V29: Allow chute movements in roll_movements
-- Date: 2026-04-06
-- Description: Add waste_piece_id and allow either roll or chute per movement
-- ============================================================================

ALTER TABLE roll_movements
  ADD COLUMN IF NOT EXISTS waste_piece_id UUID REFERENCES waste_pieces(id) ON DELETE RESTRICT;

ALTER TABLE roll_movements
  ALTER COLUMN roll_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'roll_movements_single_source'
  ) THEN
    ALTER TABLE roll_movements
      ADD CONSTRAINT roll_movements_single_source CHECK (
        (roll_id IS NOT NULL AND waste_piece_id IS NULL)
        OR (roll_id IS NULL AND waste_piece_id IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_roll_movements_waste_piece_id ON roll_movements(waste_piece_id);

-- ============================================================================
-- End V29
-- ==========================================================================
