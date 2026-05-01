-- ============================================================================
-- Migration V36: Normalize material signature into articles
-- Date: 2026-04-26
-- Description: Add articles table, backfill distinct signatures, and attach
--              rolls, waste pieces, commande items, and purchase bon items.
-- Safe rollback note: this migration is additive and does not remove legacy
-- columns, so reverting application code remains possible without data loss.
-- ============================================================================

CREATE TABLE IF NOT EXISTS articles
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    material_type VARCHAR
(
    20
) NOT NULL,
    thickness_mm DECIMAL
(
    8,
    3
) NOT NULL CHECK
(
    thickness_mm >
    0
),
    nb_plis INTEGER NOT NULL CHECK
(
    nb_plis >
    0
),
    reference VARCHAR
(
    100
) NOT NULL DEFAULT '',
    name VARCHAR
(
    255
),
    code VARCHAR
(
    100
),
    external_id VARCHAR
(
    100
),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE UNIQUE INDEX IF NOT EXISTS ux_articles_signature
    ON articles(material_type, thickness_mm, nb_plis, reference);

CREATE UNIQUE INDEX IF NOT EXISTS ux_articles_external_id
    ON articles(external_id)
    WHERE external_id IS NOT NULL;

ALTER TABLE rolls
    ADD COLUMN IF NOT EXISTS article_id UUID;
ALTER TABLE waste_pieces
    ADD COLUMN IF NOT EXISTS article_id UUID;
ALTER TABLE commande_items
    ADD COLUMN IF NOT EXISTS article_id UUID;
ALTER TABLE purchase_bon_items
    ADD COLUMN IF NOT EXISTS article_id UUID;

INSERT INTO articles (material_type, thickness_mm, nb_plis, reference)
SELECT DISTINCT signature.material_type,
                signature.thickness_mm,
                signature.nb_plis,
                signature.reference
FROM (SELECT upper(trim(material_type::text))          AS material_type,
             thickness_mm,
             nb_plis,
             coalesce(nullif(trim(reference), ''), '') AS reference
      FROM rolls
      WHERE material_type IS NOT NULL
        AND thickness_mm IS NOT NULL
        AND nb_plis IS NOT NULL

      UNION

      SELECT upper(trim(material_type::text))          AS material_type,
             thickness_mm,
             nb_plis,
             coalesce(nullif(trim(reference), ''), '') AS reference
      FROM waste_pieces
      WHERE material_type IS NOT NULL
        AND thickness_mm IS NOT NULL
        AND nb_plis IS NOT NULL

      UNION

      SELECT upper(trim(material_type::text))          AS material_type,
             thickness_mm,
             nb_plis,
             coalesce(nullif(trim(reference), ''), '') AS reference
      FROM commande_items
      WHERE material_type IS NOT NULL
        AND thickness_mm IS NOT NULL
        AND nb_plis IS NOT NULL

      UNION

      SELECT upper(trim(material_type::text)) AS material_type,
             thickness_mm,
             nb_plis,
             ''                               AS reference
      FROM purchase_bon_items
      WHERE material_type IS NOT NULL
        AND thickness_mm IS NOT NULL
        AND nb_plis IS NOT NULL) signature ON CONFLICT (material_type, thickness_mm, nb_plis, reference) DO NOTHING;

UPDATE rolls r
SET article_id = a.id FROM articles a
WHERE r.article_id IS NULL
  AND a.material_type = upper (trim (r.material_type::text))
  AND a.thickness_mm = r.thickness_mm
  AND a.nb_plis = r.nb_plis
  AND a.reference = coalesce (nullif (trim (r.reference)
    , '')
    , '');

UPDATE waste_pieces wp
SET article_id = a.id FROM articles a
WHERE wp.article_id IS NULL
  AND a.material_type = upper (trim (wp.material_type::text))
  AND a.thickness_mm = wp.thickness_mm
  AND a.nb_plis = wp.nb_plis
  AND a.reference = coalesce (nullif (trim (wp.reference)
    , '')
    , '');

UPDATE commande_items ci
SET article_id = a.id FROM articles a
WHERE ci.article_id IS NULL
  AND a.material_type = upper (trim (ci.material_type::text))
  AND a.thickness_mm = ci.thickness_mm
  AND a.nb_plis = ci.nb_plis
  AND a.reference = coalesce (nullif (trim (ci.reference)
    , '')
    , '');

UPDATE purchase_bon_items pbi
SET article_id = a.id FROM articles a
WHERE pbi.article_id IS NULL
  AND a.material_type = upper (trim (pbi.material_type::text))
  AND a.thickness_mm = pbi.thickness_mm
  AND a.nb_plis = pbi.nb_plis
  AND a.reference = '';

DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_rolls_article') THEN
ALTER TABLE rolls
    ADD CONSTRAINT fk_rolls_article
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE RESTRICT;
END IF;

    IF
NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_waste_pieces_article') THEN
ALTER TABLE waste_pieces
    ADD CONSTRAINT fk_waste_pieces_article
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE RESTRICT;
END IF;

    IF
NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_commande_items_article') THEN
ALTER TABLE commande_items
    ADD CONSTRAINT fk_commande_items_article
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE RESTRICT;
END IF;

    IF
NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_purchase_bon_items_article') THEN
ALTER TABLE purchase_bon_items
    ADD CONSTRAINT fk_purchase_bon_items_article
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE RESTRICT;
END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rolls_article_id ON rolls(article_id);
CREATE INDEX IF NOT EXISTS idx_waste_pieces_article_id ON waste_pieces(article_id);
CREATE INDEX IF NOT EXISTS idx_commande_items_article_id ON commande_items(article_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bon_items_article_id ON purchase_bon_items(article_id);
