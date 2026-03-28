-- ============================================================================
-- Migration V2: Create Inventory Tables (ROLLS, WASTE_PIECES)
-- Date: 2026-03-27
-- Description: Stock inventory and waste management
-- ============================================================================

-- ============================================================================
-- ROLLS Table (Core Inventory - FIFO Based)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reception & Supplier Info
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    
    -- Material Specifications
    material_type VARCHAR(20) NOT NULL
        CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),
    nb_plis INTEGER NOT NULL DEFAULT 1 CHECK (nb_plis > 0),
    thickness_mm DECIMAL(8,3) NOT NULL CHECK (thickness_mm > 0),
    
    -- Dimensions
    width_mm INTEGER NOT NULL CHECK (width_mm > 0),
    width_remaining_mm INTEGER,
    length_m DECIMAL(10,2) NOT NULL CHECK (length_m > 0),
    length_remaining_m DECIMAL(10,2),
    area_m2 DECIMAL(12,4) NOT NULL CHECK (area_m2 > 0),
    
    -- Status & Classification
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED')),
    waste_type VARCHAR(50)
        CHECK (waste_type IS NULL OR waste_type IN ('NORMAL', 'CHUTE_EXPLOITABLE', 'DECHET')),
    
    -- Location & Tracking
    altier_id UUID REFERENCES altier(id) ON DELETE SET NULL,
    qr_code VARCHAR(500),
    original_quantity VARCHAR(20),
    
    -- Processing tracking
    total_cuts INTEGER NOT NULL DEFAULT 0,
    total_waste_area_m2 DECIMAL(12,4) NOT NULL DEFAULT 0,
    last_processing_date TIMESTAMP,
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WASTE_PIECES Table (Byproduct Reuse Tracking)
-- Same structure as rolls, with roll_id reference
-- ============================================================================
CREATE TABLE IF NOT EXISTS waste_pieces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source Reference (ONLY DIFFERENCE from rolls)
    roll_id UUID NOT NULL REFERENCES rolls(id) ON DELETE RESTRICT,
    
    -- Material Specifications (same as rolls)
    material_type VARCHAR(20) NOT NULL
        CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),
    nb_plis INTEGER NOT NULL DEFAULT 1 CHECK (nb_plis > 0),
    thickness_mm DECIMAL(8,3) NOT NULL CHECK (thickness_mm > 0),
    
    -- Dimensions (same as rolls)
    width_mm INTEGER NOT NULL CHECK (width_mm > 0),
    width_remaining_mm INTEGER,
    length_m DECIMAL(10,2) NOT NULL CHECK (length_m > 0),
    length_remaining_m DECIMAL(10,2),
    area_m2 DECIMAL(12,4) NOT NULL CHECK (area_m2 > 0),
    
    -- Status & Classification (same as rolls)
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED')),
    waste_type VARCHAR(50)
        CHECK (waste_type IS NULL OR waste_type IN ('NORMAL', 'CHUTE_EXPLOITABLE', 'DECHET')),
    
    -- Location & Tracking (same as rolls)
    altier_id UUID REFERENCES altier(id) ON DELETE SET NULL,
    qr_code VARCHAR(500),
    original_quantity VARCHAR(20),
    
    -- Processing tracking (same as rolls)
    total_cuts INTEGER NOT NULL DEFAULT 0,
    total_waste_area_m2 DECIMAL(12,4) NOT NULL DEFAULT 0,
    last_processing_date TIMESTAMP,
    
    -- Waste-specific tracking
    commande_item_id UUID,
    classification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit (same as rolls)
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- End V2: Inventory Tables Created
-- ============================================================================
