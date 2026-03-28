-- ============================================================================
-- Flyway Migration V4: Create Performance Indexes
-- Date: 2026-03-23
-- Description: Add all performance indexes for optimal query execution
-- ============================================================================

-- ============================================================================
-- USERS Table Indexes
-- ============================================================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- SUPPLIERS Table Indexes
-- ============================================================================

CREATE INDEX idx_suppliers_country ON suppliers(country);
CREATE INDEX idx_suppliers_created_at ON suppliers(created_at DESC);

-- ============================================================================
-- ROLLS Table Indexes (CRITICAL PERFORMANCE)
-- ============================================================================

-- FIFO Selection Index - MOST CRITICAL
-- Query: SELECT * FROM rolls WHERE material_type='PU' AND status='AVAILABLE' ORDER BY received_date LIMIT 1
CREATE INDEX idx_rolls_fifo_selection ON rolls(material_type, status, received_date ASC);

-- Supporting indexes
CREATE INDEX idx_rolls_supplier_id ON rolls(supplier_id);
CREATE INDEX idx_rolls_status ON rolls(status);
CREATE INDEX idx_rolls_received_date ON rolls(received_date DESC);
CREATE INDEX idx_rolls_location ON rolls(location);
CREATE INDEX idx_rolls_created_by ON rolls(created_by);
CREATE INDEX idx_rolls_created_at ON rolls(created_at DESC);

-- Composite index for material + status queries
CREATE INDEX idx_rolls_material_status ON rolls(material_type, status);

-- ============================================================================
-- CUTTING_OPERATIONS Table Indexes
-- ============================================================================

CREATE INDEX idx_cutting_operations_roll_id ON cutting_operations(roll_id);
CREATE INDEX idx_cutting_operations_operator_id ON cutting_operations(operator_id);
CREATE INDEX idx_cutting_operations_timestamp ON cutting_operations(timestamp DESC);
CREATE INDEX idx_cutting_operations_roll_timestamp ON cutting_operations(roll_id, timestamp DESC);

-- Index for getting operations by date range
CREATE INDEX idx_cutting_operations_date ON cutting_operations(DATE(timestamp));

-- ============================================================================
-- WASTE_PIECES Table Indexes (CRITICAL FOR REUSE LOOKUP)
-- ============================================================================

-- Waste Reuse Selection Index - MOST CRITICAL for reuse lookup
-- Query: SELECT * FROM waste_pieces WHERE material_type='PU' AND status='AVAILABLE' ORDER BY area_m2 DESC
CREATE INDEX idx_waste_pieces_reuse_selection ON waste_pieces(material_type, status, area_m2 DESC);

-- Supporting indexes
CREATE INDEX idx_waste_pieces_source ON waste_pieces(from_cutting_operation_id);
CREATE INDEX idx_waste_pieces_used_in ON waste_pieces(used_in_cutting_operation_id);
CREATE INDEX idx_waste_pieces_material_type ON waste_pieces(material_type);
CREATE INDEX idx_waste_pieces_status ON waste_pieces(status);
CREATE INDEX idx_waste_pieces_area ON waste_pieces(area_m2 DESC);
CREATE INDEX idx_waste_pieces_created_at ON waste_pieces(created_at DESC);

-- Index for finding large waste pieces (> 3000mm)
CREATE INDEX idx_waste_pieces_large ON waste_pieces(status) 
    WHERE area_m2 >= 3.0 AND status = 'AVAILABLE';

-- ============================================================================
-- Performance Statistics
-- ============================================================================

-- Analyze tables for query planner optimization
ANALYZE users;
ANALYZE suppliers;
ANALYZE rolls;
ANALYZE cutting_operations;
ANALYZE waste_pieces;

-- ============================================================================
-- End V4: Performance Indexes Created (Total: ~20 indexes)
-- ============================================================================
