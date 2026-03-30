-- ============================================================================
-- Migration V14: Create Purchase Bons (BON D'ACHAT)
-- Date: 2026-03-27
-- Description: Purchase receipt documents with line items
-- ============================================================================

-- ============================================================================
-- PURCHASE_BONS Table (Bon d'achat header)
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_bons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    reference VARCHAR(80) NOT NULL UNIQUE,
    bon_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'VALIDATED')),

    -- Notes
    notes TEXT,

    -- Audit
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    validated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PURCHASE_BON_ITEMS Table (Bon d'achat line items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_bon_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_bon_id UUID NOT NULL REFERENCES purchase_bons(id) ON DELETE CASCADE,

    -- Line tracking
    line_number INTEGER NOT NULL CHECK (line_number > 0),

    -- Material Specifications
    material_type VARCHAR(20) NOT NULL
        CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),
    nb_plis INTEGER NOT NULL DEFAULT 1 CHECK (nb_plis > 0),
    thickness_mm DECIMAL(8,3) NOT NULL CHECK (thickness_mm > 0),

    -- Dimensions
    width_mm INTEGER NOT NULL CHECK (width_mm > 0),
    length_m DECIMAL(10,2) NOT NULL CHECK (length_m > 0),
    area_m2 DECIMAL(12,4) NOT NULL CHECK (area_m2 > 0),

    -- Quantity
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

    -- Optional references
    color_id UUID REFERENCES colors(id) ON DELETE SET NULL,
    altier_id UUID REFERENCES altier(id) ON DELETE SET NULL,
    qr_code VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_purchase_bons_supplier_id ON purchase_bons(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bons_bon_date ON purchase_bons(bon_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_bon_items_bon_id ON purchase_bon_items(purchase_bon_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bon_items_material ON purchase_bon_items(material_type);

-- ============================================================================
-- End V14: Purchase Bons Tables Created
-- ============================================================================
