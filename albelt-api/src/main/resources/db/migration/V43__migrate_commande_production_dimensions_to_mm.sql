-- Migrate commande_items and production_items dimensions to millimeters only

-- CommandeItems table: longueur_m -> longueur_mm
ALTER TABLE commande_items ADD COLUMN longueur_mm INTEGER;
UPDATE commande_items SET longueur_mm = CAST(CAST(longueur_m * 1000 AS INTEGER) AS INTEGER) WHERE longueur_m IS NOT NULL;
ALTER TABLE commande_items ALTER COLUMN longueur_mm SET NOT NULL;
ALTER TABLE commande_items ADD CONSTRAINT check_commande_items_longueur_mm CHECK (longueur_mm > 0);
ALTER TABLE commande_items DROP COLUMN longueur_m;

-- CommandeItems table: longueur_tolerance_m -> longueur_tolerance_mm
ALTER TABLE commande_items ADD COLUMN longueur_tolerance_mm INTEGER;
UPDATE commande_items SET longueur_tolerance_mm = CAST(CAST(longueur_tolerance_m * 1000 AS INTEGER) AS INTEGER) WHERE longueur_tolerance_m IS NOT NULL;
ALTER TABLE commande_items DROP COLUMN longueur_tolerance_m;

-- ProductionItems table: piece_length_m -> piece_length_mm
ALTER TABLE production_items ADD COLUMN piece_length_mm INTEGER;
UPDATE production_items SET piece_length_mm = CAST(CAST(piece_length_m * 1000 AS INTEGER) AS INTEGER) WHERE piece_length_m IS NOT NULL;
ALTER TABLE production_items ALTER COLUMN piece_length_mm SET NOT NULL;
ALTER TABLE production_items ADD CONSTRAINT check_production_items_piece_length_mm CHECK (piece_length_mm > 0);
ALTER TABLE production_items DROP COLUMN piece_length_m;

-- PurchaseBonItems table: length_m -> length_mm
ALTER TABLE purchase_bon_items ADD COLUMN length_mm INTEGER;
UPDATE purchase_bon_items SET length_mm = CAST(CAST(length_m * 1000 AS INTEGER) AS INTEGER) WHERE length_m IS NOT NULL;
ALTER TABLE purchase_bon_items ALTER COLUMN length_mm SET NOT NULL;
ALTER TABLE purchase_bon_items ADD CONSTRAINT check_purchase_bon_items_length_mm CHECK (length_mm > 0);
ALTER TABLE purchase_bon_items DROP COLUMN length_m;
