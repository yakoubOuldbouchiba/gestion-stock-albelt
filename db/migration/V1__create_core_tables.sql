-- ============================================================================
-- Flyway Migration V1: Create Core Tables (USERS, SUPPLIERS, ROLLS)
-- Date: 2026-03-23
-- Description: Initialize core schema for ALBEL stock management system
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS Table (Authentication & Access Control)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR'
        CHECK (role IN ('ADMIN', 'OPERATOR', 'READONLY')),
    full_name VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Users table: Stores user authentication and role information';
COMMENT ON COLUMN users.role IS 'User role: ADMIN (full access), OPERATOR (cutting operations), READONLY (reports only)';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password - never store plain text';

-- ============================================================================
-- SUPPLIERS Table (Simple CRUD - ERP Integration Ready)
-- ============================================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name VARCHAR(200) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    
    -- Contact Info
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    
    -- Business Info
    lead_time_days INTEGER DEFAULT 7
        CHECK (lead_time_days > 0),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE suppliers IS 'Suppliers table: Simple CRUD for supplier master data (future: replaceable by ERP)';
COMMENT ON COLUMN suppliers.name IS 'Supplier legal name - must be unique';
COMMENT ON COLUMN suppliers.lead_time_days IS 'Typical delivery time in days (informational only)';

-- ============================================================================
-- ALTIER Table (Workshop Locations)
-- ============================================================================

CREATE TABLE altier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    libelle VARCHAR(200) NOT NULL UNIQUE,
    adresse VARCHAR(500) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE altier IS 'Altier table: Represents physical workshop locations';
COMMENT ON COLUMN altier.libelle IS 'Workshop name/identifier';
COMMENT ON COLUMN altier.adresse IS 'Physical address of the workshop';

-- ============================================================================
-- ROLLS / STOCK Table (Core Inventory - FIFO Based)
-- ============================================================================

CREATE TABLE rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Material Specifications
    material_type VARCHAR(20) NOT NULL
        CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),
    width_mm INTEGER NOT NULL CHECK (width_mm > 0),
    length_m DECIMAL(10,2) NOT NULL CHECK (length_m > 0),
    area_m2 DECIMAL(12,4) NOT NULL CHECK (area_m2 > 0),
    
    -- Supplier & Receipt
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    original_quantity VARCHAR(20),
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Status & Location
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED')),
    location VARCHAR(50),
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE rolls IS 'Rolls table: Core inventory tracking - FIFO based on received_date';
COMMENT ON COLUMN rolls.material_type IS 'Material type: PU (Polyurea), PVC (Polyvinyl Chloride), CAOUTCHOUC (Natural Rubber)';
COMMENT ON COLUMN rolls.received_date IS 'Receipt date - CRITICAL for FIFO selection';
COMMENT ON COLUMN rolls.status IS 'Current roll state: AVAILABLE (ready to cut), OPENED (partially cut), EXHAUSTED (fully used), ARCHIVED (old)';
COMMENT ON COLUMN rolls.location IS 'Physical location: Chute number or shelf identifier';

-- ============================================================================
-- End V1: Core Tables Created
-- ============================================================================
