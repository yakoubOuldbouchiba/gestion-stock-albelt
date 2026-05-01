-- ============================================================================
-- Migration V8: Insert Sample Data
-- Date: 2026-03-27
-- Description: Load sample data for development and testing
-- ============================================================================

-- ============================================================================
-- Sample Users
-- ============================================================================
INSERT INTO users (username, email, password_hash, role, full_name, is_active, primary_altier_id)
SELECT username,
       email,
       password_hash,
       role,
       full_name,
       is_active,
       (SELECT id FROM altier LIMIT 1)
FROM (
    VALUES
    ('ahmed.operator', 'ahmed@albel.dz', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm', 'OPERATOR', 'Ahmed Benali', true), ('fatima.operator', 'fatima@albel.dz', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm', 'OPERATOR', 'Fatima Ait Ahmed', true), ('manager.report', 'manager@albel.dz', '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm', 'READONLY', 'Manager Reports', true)
    ) AS v(username, email, password_hash, role, full_name, is_active)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- Sample Suppliers
-- ============================================================================
INSERT INTO suppliers (name, country, contact_person, email, phone, lead_time_days, notes)
VALUES ('Fournisseur PU Algérie', 'DZ', 'Mohamed Khaled', 'contact@fourni-pu.dz', '+213 21 123 456', 7,
        'Main PU supplier'),
       ('Supplier PVC Europe', 'FR', 'Jean Dupont', 'sales@eu-pvc.fr', '+33 1 234 5678', 14, 'European PVC supplier'),
       ('Caoutchouc Direct', 'DZ', 'Karim Saidi', 'karim@caout.dz', '+213 23 987 654', 5,
        'Natural rubber supplier') ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Sample Colors
-- ============================================================================
INSERT INTO colors (name, hex_code)
VALUES ('Sand', '#D4A574'),
       ('Ocean', '#4A90E2'),
       ('Charcoal', '#2C3E50'),
       ('Red', '#E53935'),
       ('Blue', '#1E88E5'),
       ('Yellow', '#FDD835'),
       ('Green', '#43A047'),
       ('Orange', '#FB8C00'),
       ('Purple', '#8E24AA'),
       ('Pink', '#D81B60'),
       ('Brown', '#6D4C41'),
       ('Gray', '#9E9E9E') ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Sample Rolls
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
    ('PU', 1200, 50.0, 1, 2.5, '2026-03-19', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1)), ('PU', 1200, 45.0, 1, 2.5, '2026-03-20', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1)), ('PU', 1000, 30.0, 1, 2.5, '2026-03-21', 'OPENED', (SELECT id FROM suppliers WHERE name = 'Fournisseur PU Algérie' LIMIT 1)), ('PVC', 1000, 40.0, 1, 2.0, '2026-03-18', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Supplier PVC Europe' LIMIT 1)), ('PVC', 900, 35.0, 1, 2.0, '2026-03-20', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Supplier PVC Europe' LIMIT 1)), ('CAOUTCHOUC', 1500, 25.0, 1, 3.0, '2026-03-22', 'AVAILABLE', (SELECT id FROM suppliers WHERE name = 'Caoutchouc Direct' LIMIT 1))
    ) AS v(material_type, width_mm, length_m, nb_plis, thickness_mm, received_date, status, supplier_id)
WHERE NOT EXISTS (SELECT 1 FROM rolls WHERE received_date = '2026-03-19':: DATE AND material_type = 'PU');

-- ============================================================================
-- Sample Waste Pieces
-- Same structure as rolls, referencing a roll via roll_id
-- ============================================================================
INSERT INTO waste_pieces (roll_id, material_type, width_mm, length_m, nb_plis, thickness_mm,
                          width_remaining_mm, length_remaining_m,
                          area_m2, status, waste_type,
                          altier_id, color_id, created_by)
SELECT rolls.id,
       rolls.material_type,
       600,
       5.0,
       rolls.nb_plis,
       rolls.thickness_mm,
       600,
       5.0,
       (600::DECIMAL / 1000.0) * 5.0,
       'AVAILABLE',
       'CHUTE_EXPLOITABLE',
       rolls.altier_id,
       rolls.color_id,
       (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
FROM rolls
WHERE rolls.material_type = 'PU'
  AND rolls.status = 'OPENED'
  AND NOT EXISTS (SELECT 1 FROM waste_pieces WHERE roll_id = rolls.id)
    LIMIT 1;

-- ============================================================================
-- Sample Clients
-- ============================================================================
INSERT INTO clients (name, description, is_active)
SELECT *
FROM (VALUES ('Entreprise ACME', 'Industrial manufacturing company', true),
             ('Al-Nassim Trading', 'Trading and distribution', true),
             ('Tech Solutions DZ', 'Technology and solutions provider', true)) AS v(name, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Entreprise ACME');

-- ============================================================================
-- Sample Commandes
-- ============================================================================
INSERT INTO commandes (numero_commande, client_id, status, description, created_by)
SELECT 'CMD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-001',
       (SELECT id FROM clients WHERE name = 'Entreprise ACME' LIMIT 1),
    'PENDING',
    'Test order for PU materials',
    (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM commandes WHERE numero_commande LIKE 'CMD-%');

-- ============================================================================
-- Sample Commande Items
-- ============================================================================
INSERT INTO commande_items (commande_id, material_type, nb_plis, thickness_mm,
                            longueur_m, longueur_tolerance_m, largeur_mm,
                            quantite, surface_consommee_m2, waste_created_m2,
                            type_mouvement, status, line_number, observations)
SELECT (SELECT id FROM commandes WHERE numero_commande LIKE 'CMD-%' LIMIT 1),
    'PU', 1, 2.5, 10.0, 0.1, 500, 5, 5.0, 0.0,
    'COUPE', 'PENDING', 1, 'Sample item'
WHERE NOT EXISTS (
    SELECT 1 FROM commande_items
    WHERE commande_id = (SELECT id FROM commandes WHERE numero_commande LIKE 'CMD-%' LIMIT 1)
    );

-- ============================================================================
-- Summary
-- ============================================================================
SELECT 'Users' AS entity,
       COUNT(*)
FROM users
UNION ALL
SELECT 'Suppliers', COUNT(*)
FROM suppliers
UNION ALL
SELECT 'Altiers', COUNT(*)
FROM altier
UNION ALL
SELECT 'Rolls', COUNT(*)
FROM rolls
UNION ALL
SELECT 'Clients', COUNT(*)
FROM clients
UNION ALL
SELECT 'Commandes', COUNT(*)
FROM commandes
UNION ALL
SELECT 'Commande Items', COUNT(*)
FROM commande_items;

-- ============================================================================
-- End V8: Sample Data Inserted
-- ============================================================================
