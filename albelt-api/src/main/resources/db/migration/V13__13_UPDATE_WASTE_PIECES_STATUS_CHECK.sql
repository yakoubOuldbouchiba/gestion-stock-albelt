-- ============================================================================
-- Flyway Migration V13: Update waste_pieces status check constraint
-- Date: 2026-03-28
-- Description: Align waste_pieces.status with WasteStatus enum values
-- ============================================================================

ALTER TABLE waste_pieces
DROP
CONSTRAINT IF EXISTS waste_pieces_status_check;

ALTER TABLE waste_pieces
    ADD CONSTRAINT waste_pieces_status_check
        CHECK (status IN ('AVAILABLE', 'USED_IN_ORDER', 'SCRAP', 'RESERVED'));

-- ============================================================================
-- End V13: Waste pieces status check updated
-- ============================================================================
