-- ============================================================================
-- Flyway Migration V6: Insert Sample Data
-- Date: 2026-03-23
-- Description: Populate database with sample test data
-- ============================================================================

-- ============================================================================
-- Sample Users (3 roles)
-- ============================================================================

INSERT INTO users (username, email, password_hash, role, full_name, is_active) VALUES
-- Admin user (password: admin123 hashed with bcrypt)
('admin', 'admin@albel.dz', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm', 'ADMIN', 'Admin ALBEL', true),

-- Operator users (password: operator123 for all)
('ahmed.operator', 'ahmed@albel.dz', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm', 'OPERATOR', 'Ahmed Benali', true),
('fatima.operator', 'fatima@albel.dz', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm', 'OPERATOR', 'Fatima Ait Ahmed', true),

-- ReadOnly user (password: readonly123)
('manager.report', 'manager@albel.dz', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm', 'READONLY', 'Manager Reports', true);

-- ============================================================================
-- Sample Suppliers (3 suppliers - different materials)
-- ============================================================================

INSERT INTO suppliers (name, country, contact_person, email, phone, lead_time_days, notes) VALUES
('Fournisseur PU Algérie', 'DZ', 'Mohamed Khaled', 'contact@fourni-pu.dz', '+213 21 123 456', 7, 'Main PU supplier - reliable'),
('Supplier PVC Europe', 'FR', 'Jean Dupont', 'sales@eu-pvc.fr', '+33 1 234 5678', 14, 'European PVC - high quality'),
('Caoutchouc Direct', 'DZ', 'Karim Saidi', 'karim@caout.dz', '+213 23 987 654', 5, 'Natural rubber - fast delivery');

-- ============================================================================
-- Sample Colors (Configured list for UI)
-- ============================================================================

INSERT INTO colors (name, hex_code) VALUES
('PU', '#D4A574'),
('PVC', '#4A90E2'),
('CAOUTCHOUC', '#2C3E50');

-- ============================================================================
-- Sample Rolls (Various materials, dates, statuses)
-- ============================================================================

INSERT INTO rolls (material_type, width_mm, length_m, supplier_id, received_date, status, location, color_id, created_by) 
SELECT 
    material_type,
    width_mm,
    length_m,
    supplier_id,
    received_date,
    status,
    location,
    (SELECT id FROM colors WHERE name = material_type LIMIT 1),
    (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
FROM (
    VALUES
    -- PU Materials
    ('PU', 1200, 50.0, (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1), '2026-03-19', 'AVAILABLE', 'Chute-1'),
    ('PU', 1200, 45.0, (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1), '2026-03-20', 'AVAILABLE', 'Chute-2'),
    ('PU', 1000, 30.0, (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1), '2026-03-21', 'OPENED', 'Chute-3'),
    
    -- PVC Materials
    ('PVC', 1000, 40.0, (SELECT id FROM suppliers WHERE name = 'Supplier PVC Europe' LIMIT 1), '2026-03-18', 'AVAILABLE', 'Chute-4'),
    ('PVC', 900, 35.0, (SELECT id FROM suppliers WHERE name = 'Supplier PVC Europe' LIMIT 1), '2026-03-20', 'AVAILABLE', 'Chute-5'),
    
    -- Caoutchouc Materials
    ('CAOUTCHOUC', 1500, 25.0, (SELECT id FROM suppliers WHERE name = 'Caoutchouc Direct' LIMIT 1), '2026-03-22', 'AVAILABLE', 'Chute-6'),
    ('CAOUTCHOUC', 1400, 20.0, (SELECT id FROM suppliers WHERE name = 'Caoutchouc Direct' LIMIT 1), '2026-03-21', 'EXHAUSTED', 'Chute-7')
) AS sample_rolls(material_type, width_mm, length_m, supplier_id, received_date, status, location);

-- ============================================================================
-- Sample Cutting Operation (One complete example)
-- ============================================================================

INSERT INTO cutting_operations (roll_id, pieces_requested, nesting_result, final_utilization_pct, final_waste_area_m2, final_waste_kg, operator_id, timestamp, visualization_svg, notes)
SELECT
    r.id,
    '[{"width":400,"length":500,"qty":3},{"width":300,"length":600,"qty":2}]'::TEXT,
    '{"layout":[{"piece_id":1,"x":0,"y":0,"width":400,"length":500,"qty":3},{"piece_id":2,"x":400,"y":0,"width":300,"length":600,"qty":2}]}'::TEXT,
    78.50,
    1.2500,
    2.50,
    (SELECT id FROM users WHERE username = 'ahmed.operator' LIMIT 1),
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    '<svg><rect x="0" y="0" width="1200" height="500" fill="lightyellow"/></svg>',
    'Standard cutting operation - no issues'
FROM rolls r
WHERE r.material_type = 'PU' AND r.status = 'OPENED'
LIMIT 1;

-- ============================================================================
-- Sample Waste Pieces (From the cutting operation)
-- ============================================================================

INSERT INTO waste_pieces (from_cutting_operation_id, material_type, width_mm, length_m, status, color_id, notes)
SELECT
    co.id,
    'PU',
    600,
    2.10,
    'AVAILABLE',
    (SELECT id FROM colors WHERE name = 'PU' LIMIT 1),
    'Large waste piece - suitable for reuse'
FROM cutting_operations co
WHERE co.notes = 'Standard cutting operation - no issues'
LIMIT 1;

-- Insert a small waste piece (will be auto-marked as SCRAP by trigger)
INSERT INTO waste_pieces (from_cutting_operation_id, material_type, width_mm, length_m, status, color_id, notes)
SELECT
    co.id,
    'PU',
    200,
    1.50,
    'SCRAP',
    (SELECT id FROM colors WHERE name = 'PU' LIMIT 1),
    'Small waste piece'
FROM cutting_operations co
WHERE co.notes = 'Standard cutting operation - no issues'
LIMIT 1;

-- ============================================================================
-- Summary Statistics (Audit logging now in Spring)
-- ============================================================================

-- Show summary after loading sample data
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM suppliers) as total_suppliers,
    (SELECT COUNT(*) FROM rolls) as total_rolls,
    (SELECT COUNT(*) FROM cutting_operations) as total_cutting_ops,
    (SELECT COUNT(*) FROM waste_pieces) as total_waste_pieces;

-- ============================================================================
-- End V6: Sample Data Inserted
-- ============================================================================
