-- ============================================================================
-- V11: Default waste_type to 'NORMAL' for existing rolls and waste_pieces, add column defaults
-- ============================================================================
-- Issue: New chute form requires rolls to have wasteType='NORMAL' when 
-- converting to chutes. Existing rolls were created with NULL wasteType,
-- causing the chute form dropdown to return no results.
--
-- Solution: 
-- 1. Update all rolls with NULL waste_type to 'NORMAL'
-- 2. Update all waste_pieces with NULL waste_type to 'NORMAL'
-- 3. Add DEFAULT constraints to prevent future NULL values
-- ============================================================================

-- Update all rolls with NULL waste_type to 'NORMAL'
UPDATE rolls
SET waste_type = 'NORMAL'
WHERE waste_type IS NULL;

-- Update all waste_pieces with NULL waste_type to 'NORMAL'
UPDATE waste_pieces
SET waste_type = 'NORMAL'
WHERE waste_type IS NULL;

-- Add DEFAULT constraints to prevent future NULL values
-- This ensures new records always have a waste_type
ALTER TABLE rolls
ALTER COLUMN waste_type SET DEFAULT 'NORMAL';

ALTER TABLE waste_pieces
ALTER COLUMN waste_type SET DEFAULT 'NORMAL';
