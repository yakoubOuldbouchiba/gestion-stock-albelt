-- ============================================================================
-- Flyway Migration V31: Dashboard stats performance indexes
-- Date: 2026-04-09
-- Description: Speed up dashboard aggregates and recent lists scoped by altier.
-- ============================================================================

-- Recent rolls per altier (ORDER BY received_date DESC LIMIT N)
CREATE INDEX IF NOT EXISTS idx_rolls_altier_received_date ON rolls(altier_id, received_date DESC);

-- Aggregations/grouping by altier + status/material
CREATE INDEX IF NOT EXISTS idx_rolls_altier_status_material ON rolls(altier_id, status, material_type);

-- Waste stats scoped by altier
CREATE INDEX IF NOT EXISTS idx_waste_pieces_altier_status ON waste_pieces(altier_id, status);

ANALYZE rolls;
ANALYZE waste_pieces;

-- ============================================================================
-- End V31
-- ============================================================================
