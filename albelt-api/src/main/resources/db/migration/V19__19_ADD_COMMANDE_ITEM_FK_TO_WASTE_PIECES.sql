-- ============================================================================
-- Migration V19: Link Waste Pieces to Commande Items
-- Date: 2026-04-02
-- Description: Enforce waste_pieces.commande_item_id -> commande_items(id)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_waste_pieces_commande_item'
    ) THEN
        ALTER TABLE waste_pieces
            ADD CONSTRAINT fk_waste_pieces_commande_item
            FOREIGN KEY (commande_item_id)
            REFERENCES commande_items(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- End V19: Waste Pieces -> Commande Items FK
-- ============================================================================
