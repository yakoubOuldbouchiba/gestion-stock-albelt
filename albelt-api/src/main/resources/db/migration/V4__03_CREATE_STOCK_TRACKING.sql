-- ============================================================================
-- Migration V4: Create Stock Tracking Tables
-- Date: 2026-03-27
-- Description: Roll movements, transfers, and user location mapping
-- ============================================================================

-- ============================================================================
-- USER_ALTIER Table (User-Location Mapping)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_altier
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),

    -- Foreign Keys
    user_id UUID NOT NULL REFERENCES users
(
    id
) ON DELETE CASCADE,
    altier_id UUID NOT NULL REFERENCES altier
(
    id
)
  ON DELETE CASCADE,

    -- Unique constraint
    UNIQUE
(
    user_id,
    altier_id
),

    -- Timestamps
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE SET NULL
    );

-- ============================================================================
-- ROLL_MOVEMENTS Table (Roll Movement Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roll_movements
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),

    -- Roll Reference
    roll_id UUID NOT NULL REFERENCES rolls
(
    id
) ON DELETE RESTRICT,

    -- Movement Locations
    from_altier_id UUID REFERENCES altier
(
    id
)
  ON DELETE SET NULL,
    to_altier_id UUID NOT NULL REFERENCES altier
(
    id
)
  ON DELETE RESTRICT,

    -- Movement Status
    status_sortie BOOLEAN,
    status_entree BOOLEAN,

    -- Movement Dates
    date_sortie TIMESTAMP NOT NULL,
    date_entree TIMESTAMP,

    -- Movement Context
    reason VARCHAR
(
    200
),
    operator_id UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE RESTRICT,

    -- Documentation
    notes TEXT,
    transfer_bon_id UUID,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

-- ============================================================================
-- TRANSFER_BONS Table (Bon de Transfert)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transfer_bons
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),

    -- Transfer Locations
    from_altier_id UUID NOT NULL REFERENCES altier
(
    id
) ON DELETE RESTRICT,
    to_altier_id UUID NOT NULL REFERENCES altier
(
    id
)
  ON DELETE RESTRICT,

    -- Bon Status
    status_sortie BOOLEAN,
    status_entree BOOLEAN,

    -- Bon Dates
    date_sortie TIMESTAMP NOT NULL,
    date_entree TIMESTAMP,

    -- Who created the bon
    operator_id UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE RESTRICT,

    -- Documentation
    notes TEXT,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

-- ============================================================================
-- Ensure transfer_bon_id column and constraint exist
-- ============================================================================

-- Add column if it doesn't exist
DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roll_movements' AND column_name = 'transfer_bon_id'
    ) THEN
ALTER TABLE roll_movements
    ADD COLUMN transfer_bon_id UUID;
END IF;
END $$;

-- Add constraint if it doesn't exist
DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'roll_movements' AND constraint_name = 'fk_roll_movements_transfer_bon'
    ) THEN
ALTER TABLE roll_movements
    ADD CONSTRAINT fk_roll_movements_transfer_bon
        FOREIGN KEY (transfer_bon_id) REFERENCES transfer_bons (id) ON DELETE SET NULL;
END IF;
END $$;

-- ============================================================================
-- End V4: Stock Tracking Tables Created
-- ============================================================================
