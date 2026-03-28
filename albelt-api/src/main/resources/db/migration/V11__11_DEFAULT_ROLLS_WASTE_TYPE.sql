-- ============================================================================
-- V11: Default waste_type to 'DECHET' for existing waste_pieces, add column default
-- ============================================================================
-- Issue: Existing waste pieces were created with NULL wasteType, causing
-- inconsistent classification.
--
-- Solution:
-- 1. Update all waste_pieces with NULL waste_type to 'DECHET'
-- 2. Add DEFAULT constraint to prevent future NULL values
-- ============================================================================

-- Update all waste_pieces with NULL waste_type to 'DECHET'
UPDATE waste_pieces
SET waste_type = 'DECHET'
WHERE waste_type IS NULL;

-- Add DEFAULT constraint to prevent future NULL values
-- This ensures new records always have a waste_type
ALTER TABLE waste_pieces
ALTER COLUMN waste_type SET DEFAULT 'DECHET';
