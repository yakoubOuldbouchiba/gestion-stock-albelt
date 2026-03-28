-- ============================================================================
-- Flyway Migration V8: Update Rolls Table with Clean Schema Fields
-- Date: 2026-03-28
-- Description: Add new fields for clean schema refactoring (waste tracking)
--              and remove old consumption-related fields
-- ============================================================================

-- Add new waste tracking fields to rolls table
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS total_waste_area_m2 NUMERIC(12,4) DEFAULT 0 CHECK (total_waste_area_m2 >= 0);
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS total_cuts INTEGER DEFAULT 0 CHECK (total_cuts >= 0);
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS last_processing_date TIMESTAMP;
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS altier_id UUID;

-- Add foreign key constraint for altier if altier table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'altier') THEN
    ALTER TABLE rolls ADD CONSTRAINT rolls_altier_id_fkey 
      FOREIGN KEY (altier_id) REFERENCES altier(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for new fields if not exists
CREATE INDEX IF NOT EXISTS idx_rolls_waste_tracking ON rolls(total_waste_area_m2, status);
CREATE INDEX IF NOT EXISTS idx_rolls_last_processing ON rolls(last_processing_date);

-- Add comment for documentation
COMMENT ON COLUMN rolls.total_waste_area_m2 IS 'Total waste area in m2 after cutting operations';
COMMENT ON COLUMN rolls.total_cuts IS 'Count of cutting operations performed on this roll';
COMMENT ON COLUMN rolls.last_processing_date IS 'Timestamp of the last cutting/processing operation';
COMMENT ON COLUMN rolls.altier_id IS 'Reference to workshop/altier where roll is located';
