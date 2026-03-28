-- ============================================================================
-- Flyway Migration V2: Create Transaction Tables (CUTTING_OPERATIONS, WASTE_PIECES)
-- Date: 2026-03-23
-- Description: Create tables for cutting operations and waste management
-- ============================================================================

-- ============================================================================
-- CUTTING_OPERATIONS Table (Transaction Log)
-- ============================================================================

CREATE TABLE cutting_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Roll Reference
    roll_id UUID NOT NULL REFERENCES rolls(id) ON DELETE RESTRICT,
    
    -- Input Requirements
    pieces_requested TEXT NOT NULL,  -- JSON: [{"width":100,"length":200,"qty":5}, ...]
    
    -- Nesting Results
    nesting_result TEXT NOT NULL,    -- JSON: calculated layout and piece placement
    final_utilization_pct DECIMAL(5,2) NOT NULL
        CHECK (final_utilization_pct >= 0 AND final_utilization_pct <= 100),
    final_waste_area_m2 DECIMAL(12,4) NOT NULL
        CHECK (final_waste_area_m2 >= 0),
    final_waste_kg DECIMAL(10,2),
    
    -- Execution
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Documentation
    visualization_svg TEXT,  -- SVG rendering of cut pattern for audit
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE cutting_operations IS 'Cutting Operations table: Complete transaction log for all cutting orders';
COMMENT ON COLUMN cutting_operations.pieces_requested IS 'Input: JSON array of required pieces with dimensions and quantities';
COMMENT ON COLUMN cutting_operations.nesting_result IS 'Output: JSON object with calculated nesting layout and piece placements';
COMMENT ON COLUMN cutting_operations.final_utilization_pct IS 'Actual utilization achieved (0-100%)';
COMMENT ON COLUMN cutting_operations.visualization_svg IS 'SVG rendering for operator review before cutting';
COMMENT ON COLUMN cutting_operations.operator_id IS 'Operator who executed the cutting operation';

-- ============================================================================
-- WASTE_PIECES Table (Byproduct Reuse Tracking)
-- ============================================================================

CREATE TABLE waste_pieces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source Reference
    from_cutting_operation_id UUID NOT NULL REFERENCES cutting_operations(id) ON DELETE RESTRICT,
    
    -- Material Specifications (copied from parent roll at creation)
    material_type VARCHAR(20) NOT NULL
        CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),
    width_mm INTEGER NOT NULL CHECK (width_mm > 0),
    length_m DECIMAL(10,2) NOT NULL CHECK (length_m > 0),
    area_m2 DECIMAL(12,4) NOT NULL CHECK (area_m2 > 0),
    
    -- Status Tracking
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'USED_IN_ORDER', 'SCRAP', 'RESERVED')),
    
    -- Reuse Tracking (Optional)
    used_in_cutting_operation_id UUID REFERENCES cutting_operations(id) ON DELETE SET NULL,
    disposal_date DATE,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE waste_pieces IS 'Waste Pieces table: Track byproducts from cutting for reuse or scrap';
COMMENT ON COLUMN waste_pieces.from_cutting_operation_id IS 'Reference to cutting operation that created this waste';
COMMENT ON COLUMN waste_pieces.status IS 'Waste status: AVAILABLE (can be reused), USED_IN_ORDER (reused), SCRAP (discarded), RESERVED (allocated)';
COMMENT ON COLUMN waste_pieces.used_in_cutting_operation_id IS 'If reused, reference to cutting operation that consumed it';
COMMENT ON COLUMN waste_pieces.area_m2 IS 'Waste area size - pieces > 3000mm automatically flagged for reuse';

-- ============================================================================
-- End V2: Transaction Tables Created
-- ============================================================================
