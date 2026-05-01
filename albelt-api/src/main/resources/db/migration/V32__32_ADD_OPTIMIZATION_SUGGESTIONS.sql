-- ======================================================================
-- Migration V32: Add optimization suggestion storage
-- Date: 2026-04-09
-- ======================================================================

CREATE TABLE IF NOT EXISTS optimization_plans
(
    id
    UUID
    PRIMARY
    KEY,
    commande_item_id
    UUID
    NOT
    NULL
    REFERENCES
    commande_items
(
    id
) ON DELETE CASCADE,
    status VARCHAR
(
    20
) NOT NULL DEFAULT 'ACTIVE',
    algorithm_version VARCHAR
(
    20
) NOT NULL DEFAULT 'v1',
    rotation_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    multi_source_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    total_pieces INTEGER NOT NULL DEFAULT 0,
    placed_pieces INTEGER NOT NULL DEFAULT 0,
    source_count INTEGER NOT NULL DEFAULT 0,
    used_area_m2 DECIMAL
(
    12,
    4
) NOT NULL DEFAULT 0,
    waste_area_m2 DECIMAL
(
    12,
    4
) NOT NULL DEFAULT 0,
    utilization_pct DECIMAL
(
    6,
    2
) NOT NULL DEFAULT 0,
    svg TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_optimization_plans_item_status
    ON optimization_plans(commande_item_id, status);

CREATE TABLE IF NOT EXISTS optimization_placements
(
    id
    UUID
    PRIMARY
    KEY,
    plan_id
    UUID
    NOT
    NULL
    REFERENCES
    optimization_plans
(
    id
) ON DELETE CASCADE,
    source_type VARCHAR
(
    10
) NOT NULL,
    roll_id UUID REFERENCES rolls
(
    id
),
    waste_piece_id UUID REFERENCES waste_pieces
(
    id
),
    x_mm INTEGER NOT NULL,
    y_mm INTEGER NOT NULL,
    width_mm INTEGER NOT NULL,
    height_mm INTEGER NOT NULL,
    rotated BOOLEAN NOT NULL DEFAULT FALSE,
    piece_width_mm INTEGER NOT NULL,
    piece_length_m DECIMAL
(
    10,
    2
) NOT NULL,
    area_m2 DECIMAL
(
    12,
    4
) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT optimization_placements_source_check CHECK
(
(
    source_type =
    'ROLL'
    AND
    roll_id
    IS
    NOT
    NULL
    AND
    waste_piece_id
    IS
    NULL
)
    OR
(
    source_type =
    'WASTE'
    AND
    waste_piece_id
    IS
    NOT
    NULL
    AND
    roll_id
    IS
    NULL
)
    )
    );

CREATE INDEX IF NOT EXISTS idx_optimization_placements_plan_id
    ON optimization_placements(plan_id);

CREATE INDEX IF NOT EXISTS idx_optimization_placements_roll_id
    ON optimization_placements(roll_id);

CREATE INDEX IF NOT EXISTS idx_optimization_placements_waste_id
    ON optimization_placements(waste_piece_id);

-- ======================================================================
-- End V32
-- ======================================================================
