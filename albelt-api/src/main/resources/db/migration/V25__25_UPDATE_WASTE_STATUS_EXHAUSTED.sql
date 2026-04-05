-- ============================================================================
-- Migration V25: Add EXHAUSTED to waste_pieces status constraint
-- Date: 2026-04-04
-- Description: Align waste_pieces.status with updated WasteStatus enum
-- ============================================================================

ALTER TABLE waste_pieces
    DROP CONSTRAINT IF EXISTS waste_pieces_status_check;

ALTER TABLE waste_pieces
    ADD CONSTRAINT waste_pieces_status_check
        CHECK (status IN ('AVAILABLE', 'USED_IN_ORDER', 'SCRAP', 'RESERVED', 'EXHAUSTED'));

-- ============================================================================
-- End V25
-- ============================================================================
