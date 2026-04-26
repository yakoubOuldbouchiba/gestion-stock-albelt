-- ============================================================================
-- Migration V39: Reseed articles with color_id in the signature
-- Date: 2026-04-26
-- Description: This migration is created because V38 was already applied.
--              It updates the article uniqueness to include colors and
--              re-runs the backfill to ensure proper normalization.
-- ============================================================================

-- 1. Drop the old unique index that didn't include colors (if not already dropped)
DROP INDEX IF EXISTS ux_articles_signature;
DROP INDEX IF EXISTS ux_articles_signature_v2;

-- 2. Create a new unique index that includes color_id
-- Use COALESCE in index to handle NULL colors consistently in uniqueness checks
CREATE UNIQUE INDEX IF NOT EXISTS ux_articles_signature_v2
    ON articles(material_type, thickness_mm, nb_plis, reference, coalesce(color_id, '00000000-0000-0000-0000-000000000000'));

-- 3. Reseed articles from existing sources taking color into account
INSERT INTO articles (material_type, thickness_mm, nb_plis, reference, color_id)
SELECT DISTINCT signature.material_type,
       signature.thickness_mm,
       signature.nb_plis,
       signature.reference,
       signature.color_id
FROM (
    -- From Rolls
    SELECT upper(trim(material_type::text)) AS material_type,
           thickness_mm,
           nb_plis,
           coalesce(nullif(trim(reference), ''), '') AS reference,
           color_id
    FROM rolls
    WHERE material_type IS NOT NULL

    UNION

    -- From Waste Pieces
    SELECT upper(trim(material_type::text)) AS material_type,
           thickness_mm,
           nb_plis,
           coalesce(nullif(trim(reference), ''), '') AS reference,
           color_id
    FROM waste_pieces
    WHERE material_type IS NOT NULL

    UNION

    -- From Commande Items
    SELECT upper(trim(material_type::text)) AS material_type,
           thickness_mm,
           nb_plis,
           coalesce(nullif(trim(reference), ''), '') AS reference,
           color_id
    FROM commande_items
    WHERE material_type IS NOT NULL

    UNION
    
    -- From Purchase Bon Items
    SELECT upper(trim(material_type::text)) AS material_type,
           thickness_mm,
           nb_plis,
           '' AS reference,
           color_id
    FROM purchase_bon_items
    WHERE material_type IS NOT NULL
) signature
ON CONFLICT (material_type, thickness_mm, nb_plis, reference, coalesce(color_id, '00000000-0000-0000-0000-000000000000')) DO NOTHING;

-- 4. Update the article_id in all inventory tables
-- Rolls (Must be updated first so other tables can inherit)
UPDATE rolls r
SET article_id = a.id
FROM articles a
WHERE a.material_type = upper(trim(r.material_type::text))
  AND a.thickness_mm = r.thickness_mm
  AND a.nb_plis = r.nb_plis
  AND a.reference = coalesce(nullif(trim(r.reference), ''), '')
  AND (a.color_id IS NOT DISTINCT FROM r.color_id);

-- Waste Pieces
UPDATE waste_pieces wp
SET article_id = a.id
FROM articles a
WHERE a.material_type = upper(trim(wp.material_type::text))
  AND a.thickness_mm = wp.thickness_mm
  AND a.nb_plis = wp.nb_plis
  AND a.reference = coalesce(nullif(trim(wp.reference), ''), '')
  AND (a.color_id IS NOT DISTINCT FROM wp.color_id);

-- Commande Items
UPDATE commande_items ci
SET article_id = a.id
FROM articles a
WHERE a.material_type = upper(trim(ci.material_type::text))
  AND a.thickness_mm = ci.thickness_mm
  AND a.nb_plis = ci.nb_plis
  AND a.reference = coalesce(nullif(trim(ci.reference), ''), '')
  AND (a.color_id IS NOT DISTINCT FROM ci.color_id);

-- Purchase Bon Items
UPDATE purchase_bon_items pbi
SET article_id = a.id
FROM articles a
WHERE a.material_type = upper(trim(pbi.material_type::text))
  AND a.thickness_mm = pbi.thickness_mm
  AND a.nb_plis = pbi.nb_plis
  AND a.reference = ''
  AND (a.color_id IS NOT DISTINCT FROM pbi.color_id);

-- 5. Clean up articles that are no longer the most specific match
DELETE FROM articles a
WHERE NOT EXISTS (SELECT 1 FROM rolls WHERE article_id = a.id)
  AND NOT EXISTS (SELECT 1 FROM waste_pieces WHERE article_id = a.id)
  AND NOT EXISTS (SELECT 1 FROM commande_items WHERE article_id = a.id)
  AND NOT EXISTS (SELECT 1 FROM purchase_bon_items WHERE article_id = a.id);
