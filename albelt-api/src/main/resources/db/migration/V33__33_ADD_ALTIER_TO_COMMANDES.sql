-- Migration V33: Add altier_id to commandes (order header)
-- Purpose: Allow selecting a workshop (altier) for an order and constrain optimization to that workshop

ALTER TABLE commandes
    ADD COLUMN IF NOT EXISTS altier_id UUID;

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_commandes_altier'
          AND table_name = 'commandes'
    ) THEN
ALTER TABLE commandes
    ADD CONSTRAINT fk_commandes_altier
        FOREIGN KEY (altier_id)
            REFERENCES altier (id)
            ON DELETE SET NULL;
END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_commandes_altier_id ON commandes(altier_id);
