-- ============================================================================
-- Flyway Migration V30: Create Return Bons (bon de retour) and items
-- Date: 2026-04-06
-- Description: Track commande returns and related item dispositions
-- ============================================================================

CREATE TABLE return_bons
(
    id             UUID PRIMARY KEY      DEFAULT gen_random_uuid(),

    commande_id    UUID         NOT NULL REFERENCES commandes (id) ON DELETE RESTRICT,
    return_mode    VARCHAR(20)  NOT NULL
        CHECK (return_mode IN ('TOTAL', 'PARTIAL')),
    reason         VARCHAR(100) NOT NULL,
    reason_details TEXT,
    notes          TEXT,

    created_by     UUID         NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE return_bon_items
(
    id                 UUID PRIMARY KEY     DEFAULT gen_random_uuid(),

    return_bon_id      UUID        NOT NULL REFERENCES return_bons (id) ON DELETE CASCADE,
    commande_item_id   UUID        NOT NULL REFERENCES commande_items (id) ON DELETE RESTRICT,
    production_item_id UUID        REFERENCES production_items (id) ON DELETE SET NULL,

    return_type        VARCHAR(20) NOT NULL
        CHECK (return_type IN ('MATIERE', 'MESURE')),
    measure_action     VARCHAR(20)
        CHECK (measure_action IN ('AJUST', 'DECHET')),

    quantity           INTEGER     NOT NULL CHECK (quantity > 0),
    adjusted_width_mm  INTEGER,
    adjusted_length_m  DECIMAL(10, 2),

    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_return_bons_commande_id ON return_bons (commande_id);
CREATE INDEX idx_return_bons_created_at ON return_bons (created_at DESC);

CREATE INDEX idx_return_bon_items_bon_id ON return_bon_items (return_bon_id);
CREATE INDEX idx_return_bon_items_commande_item_id ON return_bon_items (commande_item_id);
CREATE INDEX idx_return_bon_items_production_item_id ON return_bon_items (production_item_id);

-- ============================================================================
-- End V30
-- ============================================================================
