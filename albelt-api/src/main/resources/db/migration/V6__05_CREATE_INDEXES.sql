-- ============================================================================
-- Migration V6: Create Performance Indexes
-- Date: 2026-03-27
-- Description: Comprehensive indexes for optimal query performance
-- ============================================================================

-- USERS Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_primary_altier_id ON users(primary_altier_id);

-- SUPPLIERS Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(country);

-- ROLLS Indexes (CRITICAL FIFO)
CREATE INDEX IF NOT EXISTS idx_rolls_fifo_selection ON rolls(material_type, status, received_date ASC);
CREATE INDEX IF NOT EXISTS idx_rolls_supplier_id ON rolls(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rolls_status ON rolls(status);
CREATE INDEX IF NOT EXISTS idx_rolls_received_date ON rolls(received_date DESC);
CREATE INDEX IF NOT EXISTS idx_rolls_material_status ON rolls(material_type, status);
CREATE INDEX IF NOT EXISTS idx_rolls_altier_id ON rolls(altier_id);
CREATE INDEX IF NOT EXISTS idx_rolls_created_by ON rolls(created_by);

-- WASTE_PIECES Indexes (CRITICAL REUSE)
CREATE INDEX IF NOT EXISTS idx_waste_pieces_reuse_selection ON waste_pieces(material_type, status, area_m2 DESC);
CREATE INDEX IF NOT EXISTS idx_waste_pieces_roll_id ON waste_pieces(roll_id);
CREATE INDEX IF NOT EXISTS idx_waste_pieces_material_type ON waste_pieces(material_type);
CREATE INDEX IF NOT EXISTS idx_waste_pieces_status ON waste_pieces(status);
CREATE INDEX IF NOT EXISTS idx_waste_pieces_commande_item ON waste_pieces(commande_item_id);
CREATE INDEX IF NOT EXISTS idx_waste_pieces_created_by ON waste_pieces(created_by);

-- CLIENTS Indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

-- CLIENT CONTACT Indexes
CREATE INDEX IF NOT EXISTS idx_client_phones_client_id ON client_phones(client_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_client_id ON client_emails(client_id);
CREATE INDEX IF NOT EXISTS idx_client_addresses_client_id ON client_addresses(client_id);
CREATE INDEX IF NOT EXISTS idx_client_representatives_client_id ON client_representatives(client_id);

-- COMMANDES Indexes
CREATE INDEX IF NOT EXISTS idx_commandes_numero ON commandes(numero_commande);
CREATE INDEX IF NOT EXISTS idx_commandes_client_id ON commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_status ON commandes(status);
CREATE INDEX IF NOT EXISTS idx_commandes_created_by ON commandes(created_by);

-- COMMANDE_ITEMS Indexes
CREATE INDEX IF NOT EXISTS idx_commande_items_commande_id ON commande_items(commande_id);
CREATE INDEX IF NOT EXISTS idx_commande_items_material_type ON commande_items(material_type);
CREATE INDEX IF NOT EXISTS idx_commande_items_status ON commande_items(status);
CREATE INDEX IF NOT EXISTS idx_commande_items_type_mouvement ON commande_items(type_mouvement);
CREATE INDEX IF NOT EXISTS idx_commande_items_last_roll_used ON commande_items(last_roll_used_id);

-- USER_ALTIER Indexes
CREATE INDEX IF NOT EXISTS idx_user_altier_user_id ON user_altier(user_id);
CREATE INDEX IF NOT EXISTS idx_user_altier_altier_id ON user_altier(altier_id);

-- ROLL_MOVEMENTS Indexes
CREATE INDEX IF NOT EXISTS idx_roll_movements_roll_id ON roll_movements(roll_id);
CREATE INDEX IF NOT EXISTS idx_roll_movements_from_altier ON roll_movements(from_altier_id);
CREATE INDEX IF NOT EXISTS idx_roll_movements_to_altier ON roll_movements(to_altier_id);
CREATE INDEX IF NOT EXISTS idx_roll_movements_transfer_bon ON roll_movements(transfer_bon_id);
CREATE INDEX IF NOT EXISTS idx_roll_movements_date_sortie ON roll_movements(date_sortie);
CREATE INDEX IF NOT EXISTS idx_roll_movements_date_entree ON roll_movements(date_entree);
CREATE INDEX IF NOT EXISTS idx_roll_movements_operator ON roll_movements(operator_id);

-- TRANSFER_BONS Indexes
CREATE INDEX IF NOT EXISTS idx_transfer_bons_from_altier ON transfer_bons(from_altier_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bons_to_altier ON transfer_bons(to_altier_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bons_operator ON transfer_bons(operator_id);

-- CLIENT_AUDIT_LOG Indexes
CREATE INDEX IF NOT EXISTS idx_client_audit_log_client_id ON client_audit_log(client_id);
CREATE INDEX IF NOT EXISTS idx_client_audit_log_created_at ON client_audit_log(created_at DESC);

-- MATERIAL_CHUTE_THRESHOLDS Indexes
CREATE INDEX IF NOT EXISTS idx_material_chute_thresholds_material ON material_chute_thresholds(material_type);

-- ============================================================================
-- Query Statistics
-- ============================================================================
ANALYZE users;
ANALYZE suppliers;
ANALYZE altier;
ANALYZE rolls;
ANALYZE waste_pieces;
ANALYZE clients;
ANALYZE commandes;
ANALYZE commande_items;
ANALYZE user_altier;
ANALYZE roll_movements;
ANALYZE transfer_bons;
ANALYZE client_audit_log;
ANALYZE material_chute_thresholds;

-- ============================================================================
-- End V6: Performance Indexes Created
-- ============================================================================
