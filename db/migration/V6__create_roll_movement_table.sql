-- ============================================================================
-- Flyway Migration V6: Create Roll Movement Operations Table
-- Date: 2026-03-25
-- Description: Track roll movements between altiers with timestamps and historical info
-- ============================================================================

-- ============================================================================
-- ROLL_MOVEMENTS Table (Movement History & Location Tracking)
-- ============================================================================

CREATE TABLE roll_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Roll Reference
    roll_id UUID NOT NULL REFERENCES rolls(id) ON DELETE RESTRICT,
    
    -- Source and Destination
    from_altier_id UUID REFERENCES altier(id) ON DELETE SET NULL,
    to_altier_id UUID NOT NULL REFERENCES altier(id) ON DELETE RESTRICT,
    
    -- Movement Timestamps
    date_sortie TIMESTAMP NOT NULL,     -- Date when roll left the source altier
    date_entree TIMESTAMP NOT NULL,     -- Date when roll entered the destination altier
    
    -- Movement Details
    reason VARCHAR(100),                -- Reason for movement (CUTTING, TRANSFER, STORAGE, etc.)
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Documentation
    notes TEXT,
    reference_number VARCHAR(50),       -- External reference (e.g., cutting operation ID)
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_roll_movements_roll_id ON roll_movements(roll_id);
CREATE INDEX idx_roll_movements_from_altier ON roll_movements(from_altier_id);
CREATE INDEX idx_roll_movements_to_altier ON roll_movements(to_altier_id);
CREATE INDEX idx_roll_movements_date_entree ON roll_movements(date_entree DESC);
CREATE INDEX idx_roll_movements_operator_id ON roll_movements(operator_id);

COMMENT ON TABLE roll_movements IS 'Roll Movements table: Complete history of roll transfers between altiers (workshops)';
COMMENT ON COLUMN roll_movements.roll_id IS 'Reference to the roll being moved';
COMMENT ON COLUMN roll_movements.from_altier_id IS 'Source workshop (NULL if receipt from supplier)';
COMMENT ON COLUMN roll_movements.to_altier_id IS 'Destination workshop for the roll';
COMMENT ON COLUMN roll_movements.date_sortie IS 'Timestamp when roll left the source location';
COMMENT ON COLUMN roll_movements.date_entree IS 'Timestamp when roll arrived at destination';
COMMENT ON COLUMN roll_movements.reason IS 'Reason for movement to track roll lifecycle';
COMMENT ON COLUMN roll_movements.operator_id IS 'User who recorded the movement';
COMMENT ON COLUMN roll_movements.reference_number IS 'Link to related operations (cutting ID, order number, etc.)';

-- ============================================================================
-- End V6: Roll Movement Tracking Created
-- ============================================================================
