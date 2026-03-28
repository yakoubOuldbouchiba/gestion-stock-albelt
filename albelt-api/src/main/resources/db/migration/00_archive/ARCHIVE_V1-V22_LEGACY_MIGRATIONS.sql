-- ============================================================================
-- LEGACY ARCHIVE: V1__create_core_tables.sql
-- Date: 2026-03-23
-- ARCHIVED: This file has been superseded by new clean structure
-- See: ../01_core/V1__00_CREATE_CORE_TABLES.sql
-- ============================================================================
-- Original file contents preserved for reference
-- This migration has already been executed and will not be re-run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR'
        CHECK (role IN ('ADMIN', 'OPERATOR', 'READONLY')),
    full_name VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    lead_time_days INTEGER DEFAULT 7 CHECK (lead_time_days > 0),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE altier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    libelle VARCHAR(200) NOT NULL UNIQUE,
    adresse VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('PU', 'PVC', 'CAOUTCHOUC')),
    nb_plis INTEGER NOT NULL DEFAULT 1 CHECK (nb_plis > 0),
    thickness_mm DECIMAL(8,3) NOT NULL CHECK (thickness_mm > 0),
    width_initial_mm INTEGER NOT NULL CHECK (width_initial_mm > 0),
    length_initial_m DECIMAL(10,2) NOT NULL CHECK (length_initial_m > 0),
    area_initial_m2 DECIMAL(12,4) NOT NULL CHECK (area_initial_m2 > 0),
    surface_consumed_m2 DECIMAL(12,4) NOT NULL DEFAULT 0 CHECK (surface_consumed_m2 >= 0),
    surface_remaining_m2 DECIMAL(12,4) NOT NULL CHECK (surface_remaining_m2 >= 0),
    length_remaining_m DECIMAL(10,2) NOT NULL CHECK (length_remaining_m >= 0),
    surface_remaining_percent DECIMAL(5,2) NOT NULL DEFAULT 100 CHECK (surface_remaining_percent >= 0 AND surface_remaining_percent <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED')),
    waste_type VARCHAR(50) CHECK (waste_type IS NULL OR waste_type IN ('NORMAL', 'CHUTE_EXPLOITABLE', 'DECHET')),
    location VARCHAR(50),
    qr_code VARCHAR(500),
    original_quantity VARCHAR(20),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- File continues with COMMENTs - see original for full details
