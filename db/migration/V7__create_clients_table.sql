-- ============================================================================
-- Flyway Migration V7: Create Clients Management Tables
-- Date: 2026-03-27
-- Description: Create tables for client management with phones, emails, addresses, and representatives
-- ============================================================================

-- ============================================================================
-- CLIENTS Table (Main Client Data)
-- ============================================================================
CREATE TABLE clients (
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

COMMENT ON TABLE clients IS 'Clients table: Stores main client/customer information';
COMMENT ON COLUMN clients.name IS 'Client name or company name - can be non-unique (allow duplicates for history)';
COMMENT ON COLUMN clients.is_active IS 'Soft delete flag - inactive clients are hidden by default';

-- Create unique constraint on name + created_at to allow version history
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_is_active ON clients(is_active);

-- ============================================================================
-- CLIENT_PHONES Table (Multiple Phones per Client)
-- ============================================================================
CREATE TABLE client_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Phone Info
    phone_number VARCHAR(20) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    phone_type VARCHAR(50) DEFAULT 'MOBILE',  -- MOBILE, LANDLINE, OTHER
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE client_phones IS 'Stores multiple phone numbers for each client';
COMMENT ON COLUMN client_phones.is_main IS 'Mark one or more phones as primary contact';
COMMENT ON COLUMN client_phones.phone_type IS 'Type of phone: MOBILE, LANDLINE, OTHER';

CREATE INDEX idx_client_phones_client_id ON client_phones(client_id);
CREATE INDEX idx_client_phones_is_main ON client_phones(client_id, is_main);

-- ============================================================================
-- CLIENT_EMAILS Table (Multiple Emails per Client)
-- ============================================================================
CREATE TABLE client_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Email Info
    email_address VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    email_type VARCHAR(50) DEFAULT 'BUSINESS',  -- BUSINESS, PERSONAL, OTHER
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE client_emails IS 'Stores multiple email addresses for each client';
COMMENT ON COLUMN client_emails.is_main IS 'Mark one or more emails as primary contact';
COMMENT ON COLUMN client_emails.email_type IS 'Type of email: BUSINESS, PERSONAL, OTHER';

CREATE INDEX idx_client_emails_client_id ON client_emails(client_id);
CREATE INDEX idx_client_emails_is_main ON client_emails(client_id, is_main);

-- ============================================================================
-- CLIENT_ADDRESSES Table (Multiple Addresses per Client)
-- ============================================================================
CREATE TABLE client_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Address Info
    street_address VARCHAR(500) NOT NULL,
    city VARCHAR(200),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'DZ',
    is_main BOOLEAN DEFAULT false,
    address_type VARCHAR(50) DEFAULT 'BUSINESS',  -- BUSINESS, BILLING, SHIPPING, OTHER
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE client_addresses IS 'Stores multiple addresses for each client';
COMMENT ON COLUMN client_addresses.is_main IS 'Mark one or more addresses as primary/main address';
COMMENT ON COLUMN client_addresses.address_type IS 'Type of address: BUSINESS, BILLING, SHIPPING, OTHER';

CREATE INDEX idx_client_addresses_client_id ON client_addresses(client_id);
CREATE INDEX idx_client_addresses_is_main ON client_addresses(client_id, is_main);

-- ============================================================================
-- CLIENT_REPRESENTATIVES Table (Representatives for Each Client)
-- ============================================================================
CREATE TABLE client_representatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Representative Info
    name VARCHAR(300) NOT NULL,
    position VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE client_representatives IS 'Stores representatives/contacts for each client';
COMMENT ON COLUMN client_representatives.is_primary IS 'Mark one representative as primary contact';
COMMENT ON COLUMN client_representatives.position IS 'Job position or title of the representative';

CREATE INDEX idx_client_representatives_client_id ON client_representatives(client_id);
CREATE INDEX idx_client_representatives_is_primary ON client_representatives(client_id, is_primary);

-- ============================================================================
-- Audit Logging (for client changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE
    changed_by UUID,
    change_details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE client_audit_log IS 'Audit trail for client management changes';

CREATE INDEX idx_client_audit_log_client_id ON client_audit_log(client_id);
CREATE INDEX idx_client_audit_log_created_at ON client_audit_log(created_at);
