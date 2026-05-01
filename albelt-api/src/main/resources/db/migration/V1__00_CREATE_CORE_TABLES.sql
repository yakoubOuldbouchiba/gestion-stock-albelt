-- ============================================================================
-- Migration V1: Create Core Tables (USERS, SUPPLIERS, ALTIERS)
-- Date: 2026-03-27
-- Description: Initialize core schema with clean, optimized structure
-- ============================================================================

-- Enable UUID extension
CREATE
EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS Table (Authentication & Access Control)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),

    -- Authentication
    username VARCHAR
(
    100
) NOT NULL UNIQUE,
    email VARCHAR
(
    100
) NOT NULL UNIQUE,
    password_hash VARCHAR
(
    255
) NOT NULL,

    -- Profile
    role VARCHAR
(
    20
) NOT NULL DEFAULT 'OPERATOR'
    CHECK
(
    role
    IN
(
    'ADMIN',
    'OPERATOR',
    'READONLY'
)),
    full_name VARCHAR
(
    200
),
    is_active BOOLEAN DEFAULT true,

    -- Location
    primary_altier_id UUID,

    -- Timestamps
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

-- ============================================================================
-- SUPPLIERS Table (Material Suppliers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),

    -- Basic Info
    name VARCHAR
(
    200
) NOT NULL UNIQUE,
    country VARCHAR
(
    100
) NOT NULL,

    -- Contact Info
    contact_person VARCHAR
(
    100
),
    email VARCHAR
(
    100
),
    phone VARCHAR
(
    20
),

    -- Business Info
    lead_time_days INTEGER DEFAULT 7 CHECK
(
    lead_time_days >
    0
),
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

-- ============================================================================
-- ALTIER Table (Workshop Locations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS altier
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),

    -- Basic Info
    libelle VARCHAR
(
    200
) NOT NULL UNIQUE,
    adresse VARCHAR
(
    500
) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

-- Add constraint after altier table exists
ALTER TABLE users
    ADD CONSTRAINT fk_users_primary_altier
        FOREIGN KEY (primary_altier_id) REFERENCES altier (id) ON DELETE SET NULL;

-- Insert default altiers
INSERT INTO altier (libelle, adresse)
VALUES ('Atelier Principal', 'Alger, DZ'),
       ('Atelier Secondaire', 'Oran, DZ') ON CONFLICT (libelle) DO NOTHING;

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role, full_name, is_active)
VALUES ('admin',
        'admin@albel.dz',
        '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm',
        'ADMIN',
        'Admin ALBEL',
        true) ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- End V1: Core Tables Created
-- ============================================================================
