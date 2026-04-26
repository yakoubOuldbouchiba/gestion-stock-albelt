-- ============================================================================
-- Migration V40: Refine waste_pieces article mapping
-- Date: 2026-04-26
-- Description: Ensures waste pieces inherit their article_id from their parent roll.
--              This overrides any signature-based mapping to ensure physical consistency.
-- ============================================================================

-- 1. Update waste_pieces to inherit the article_id from its parent roll
UPDATE waste_pieces wp
SET article_id = r.article_id
FROM rolls r
WHERE wp.roll_id = r.id
  AND r.article_id IS NOT NULL;

-- 2. Clean up any articles that were only referenced by waste pieces 
-- and are now orphaned after inheriting from rolls
DELETE FROM articles a
WHERE NOT EXISTS (SELECT 1 FROM rolls WHERE article_id = a.id)
  AND NOT EXISTS (SELECT 1 FROM waste_pieces WHERE article_id = a.id)
  AND NOT EXISTS (SELECT 1 FROM commande_items WHERE article_id = a.id)
  AND NOT EXISTS (SELECT 1 FROM purchase_bon_items WHERE article_id = a.id);
