-- ============================================================================
-- Migration V3: Create Orders Tables (CLIENTS, COMMANDES, ITEMS)
-- Date: 2026-03-27
-- Description: Complete order management system
-- ============================================================================

-- ============================================================================
-- CLIENTS Table (Main Client Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name VARCHAR(300) NOT NULL,
    description TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CLIENT Contact Info Tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    phone_type VARCHAR(50) DEFAULT 'MOBILE',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email_address VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    email_type VARCHAR(50) DEFAULT 'BUSINESS',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    street_address VARCHAR(500) NOT NULL,
    city VARCHAR(200),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'DZ',
    is_main BOOLEAN DEFAULT false,
    address_type VARCHAR(50) DEFAULT 'BUSINESS',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_representatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(300) NOT NULL,
    position VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- COMMANDES Table (Order Header)
-- ============================================================================
CREATE TABLE IF NOT EXISTS commandes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Order Identification
    numero_commande VARCHAR(50) NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ENCOURS', 'COMPLETED', 'CANCELLED', 'ON_HOLD')),
    
    -- Order Info
    description TEXT,
    notes TEXT,
    
    -- User Info
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- COMMANDE_ITEMS Table (Order Line Items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS commande_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commande_id UUID NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
    
    -- Material Specifications
    material_type VARCHAR(20) NOT NULL
        CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),
    nb_plis INTEGER NOT NULL DEFAULT 1 CHECK (nb_plis > 0),
    thickness_mm DECIMAL(8,3) NOT NULL CHECK (thickness_mm > 0),
    
    -- Dimensions
    longueur_m DECIMAL(10,2) NOT NULL CHECK (longueur_m > 0),
    longueur_tolerance_m DECIMAL(10,2) DEFAULT 0,
    largeur_mm INTEGER NOT NULL CHECK (largeur_mm > 0),
    
    -- Quantities
    quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
    surface_consommee_m2 DECIMAL(12,4) NOT NULL DEFAULT 0 CHECK (surface_consommee_m2 >= 0),
    waste_created_m2 DECIMAL(12,4) DEFAULT 0,
    
    -- Movement Type & Status
    type_mouvement VARCHAR(50) NOT NULL DEFAULT 'COUPE'
        CHECK (type_mouvement IN ('ENCOURS', 'COUPE', 'SORTIE', 'RETOUR')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    
    -- Processing
    line_number INTEGER NOT NULL CHECK (line_number > 0),
    observations TEXT,
    processing_date TIMESTAMP,
    last_roll_used_id UUID REFERENCES rolls(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CLIENT_AUDIT_LOG Table (Change Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    changed_by UUID,
    change_details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- End V3: Orders Tables Created
-- ============================================================================
