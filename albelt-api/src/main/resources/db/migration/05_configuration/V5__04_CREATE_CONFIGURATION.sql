-- ============================================================================
-- Migration V5: Create Configuration Tables
-- Date: 2026-03-27
-- Description: Material thresholds and system settings
-- ============================================================================

-- ============================================================================
-- MATERIAL_CHUTE_THRESHOLDS Table (Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS material_chute_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    material_type VARCHAR(20) NOT NULL UNIQUE
        CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),

    -- Minimum dimensions for reusable waste
    min_width_mm INTEGER NOT NULL DEFAULT 0 CHECK (min_width_mm >= 0),
    min_length_m DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (min_length_m >= 0),

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed configuration
INSERT INTO material_chute_thresholds (material_type, min_width_mm, min_length_m)
VALUES
  ('PU', 300, 1.0),
  ('PVC', 300, 1.0),
  ('CAOUTCHOUC', 300, 1.0)
ON CONFLICT (material_type) DO NOTHING;

-- ============================================================================
-- End V5: Configuration Tables Created
-- ============================================================================
