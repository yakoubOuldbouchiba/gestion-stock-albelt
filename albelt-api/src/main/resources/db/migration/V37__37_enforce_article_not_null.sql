ALTER TABLE commande_items
    ALTER COLUMN article_id SET NOT NULL;

ALTER TABLE waste_pieces
    ALTER COLUMN article_id SET NOT NULL;

ALTER TABLE rolls
    ALTER COLUMN article_id SET NOT NULL;
