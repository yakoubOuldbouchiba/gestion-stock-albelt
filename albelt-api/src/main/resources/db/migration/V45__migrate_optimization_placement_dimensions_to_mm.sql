-- ============================================================================
-- V45: Update OptimizationPlacement to Use Millimeters Only
-- ============================================================================
-- Converts piece_length_m to piece_length_mm for consistency with all other dimension fields

BEGIN;

-- ============================================================================
-- OptimizationPlacements table: piece_length_m -> piece_length_mm
-- ============================================================================

-- Add new column with converted data (meter * 1000 = millimeter)
ALTER TABLE optimization_placements 
ADD COLUMN piece_length_mm INTEGER;

-- Migrate existing data: multiply meter value by 1000 to get millimeters
UPDATE optimization_placements 
SET piece_length_mm = CAST(CAST(piece_length_m * 1000 AS INTEGER) AS INTEGER) 
WHERE piece_length_m IS NOT NULL;

-- Drop the old column
ALTER TABLE optimization_placements 
DROP COLUMN piece_length_m;

COMMIT;
