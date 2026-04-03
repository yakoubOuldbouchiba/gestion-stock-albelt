-- ============================================================================
-- Migration V21: Add good_production and production_miss to production_items
-- Date: 2026-04-03
-- Description: Track production match status and mismatch details
-- ============================================================================

ALTER TABLE production_items
    ADD COLUMN IF NOT EXISTS good_production BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE production_items
    ADD COLUMN IF NOT EXISTS production_miss TEXT;

-- ============================================================================
-- End V21
-- ============================================================================
