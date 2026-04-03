-- ============================================================================
-- Migration V22: Disable production item quantity trigger
-- Date: 2026-04-03
-- Description: Drop quantity validation trigger for production_items
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_production_items_validate_quantity ON production_items;

-- Optional: keep function for rollback/diagnostics; no DROP FUNCTION here.

-- ============================================================================
-- End V22
-- ============================================================================
