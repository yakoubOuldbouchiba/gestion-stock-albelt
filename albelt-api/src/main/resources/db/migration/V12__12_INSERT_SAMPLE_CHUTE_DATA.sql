-- ============================================================================
-- V12: Insert Sample Chute Data
-- ============================================================================
-- Description: Insert sample roll data for chute development and testing purposes
-- ============================================================================

-- ============================================================================
-- Sample Reusable Chutes
-- ============================================================================
INSERT INTO rolls (material_type, width_mm, length_m, nb_plis, thickness_mm,
                   width_remaining_mm, length_remaining_m,
                   area_m2, supplier_id, received_date, status,
                   altier_id, color_id, created_by)
SELECT material_type,
       width_mm,
       length_m,
       nb_plis,
       thickness_mm,
       width_mm,
       length_m,
       (width_mm::DECIMAL / 1000.0) * length_m,
       supplier_id,
       received_date::DATE, status,
       (SELECT id FROM altier LIMIT 1),
    (SELECT id FROM colors ORDER BY random() LIMIT 1),
    (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
FROM (
    VALUES
    ('PU', 800, 15.0, 1, 2.5, '2026-03-23', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1)), ('PU', 600, 12.0, 1, 2.5, '2026-03-24', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1)), ('PVC', 700, 10.0, 1, 2.0, '2026-03-23', 'OPENED', (SELECT id FROM suppliers WHERE name = 'Supplier PVC Europe' LIMIT 1)), ('CAOUTCHOUC', 1000, 8.0, 1, 3.0, '2026-03-25', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Caoutchouc Direct' LIMIT 1))
    ) AS v(material_type, width_mm, length_m, nb_plis, thickness_mm, received_date, status, supplier_id)
WHERE NOT EXISTS (
    SELECT 1 FROM rolls
    WHERE received_date = '2026-03-23':: DATE
  AND material_type = 'PU'
    );

-- ============================================================================
-- Sample Waste Chutes
-- ============================================================================
INSERT INTO rolls (material_type, width_mm, length_m, nb_plis, thickness_mm,
                   width_remaining_mm, length_remaining_m,
                   area_m2, supplier_id, received_date, status,
                   altier_id, color_id, created_by)
SELECT material_type,
       width_mm,
       length_m,
       nb_plis,
       thickness_mm,
       width_mm,
       length_m,
       (width_mm::DECIMAL / 1000.0) * length_m,
       supplier_id,
       received_date::DATE, status,
       (SELECT id FROM altier LIMIT 1),
    (SELECT id FROM colors ORDER BY random() LIMIT 1),
    (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
FROM (
    VALUES
    ('PU', 500, 8.0, 1, 2.5, '2026-03-22', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1)), ('PU', 400, 6.0, 1, 2.5, '2026-03-23', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1)), ('PVC', 450, 7.0, 1, 2.0, '2026-03-22', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Supplier PVC Europe' LIMIT 1)), ('CAOUTCHOUC', 600, 5.0, 1, 3.0, '2026-03-24', 'OPENED', (SELECT id FROM suppliers WHERE name = 'Caoutchouc Direct' LIMIT 1))
    ) AS v(material_type, width_mm, length_m, nb_plis, thickness_mm, received_date, status, supplier_id)
WHERE NOT EXISTS (
    SELECT 1 FROM rolls
    WHERE received_date = '2026-03-22':: DATE
  AND material_type = 'PU'
    );
