-- ============================================================================
-- Migration V20: Add reference and color to commande_items
-- Date: 2026-04-03
-- Description: Add reference and color_id fields to order line items
-- ============================================================================

ALTER TABLE commande_items
    ADD COLUMN IF NOT EXISTS reference VARCHAR(100),
    ADD COLUMN IF NOT EXISTS color_id UUID REFERENCES colors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_commande_items_color_id ON commande_items(color_id);

-- ============================================================================
-- End V20: commande_items reference + color
-- ============================================================================
