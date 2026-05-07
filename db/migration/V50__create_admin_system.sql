-- ============================================================
-- V50: Admin Management System
--   1. Add SUPER_ADMIN to user role constraint
--   2. Create audit_logs table
--   3. Create permissions reference table (static data)
-- ============================================================

-- 1. Extend allowed roles (PostgreSQL check constraint)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        UUID,
    actor_username  VARCHAR(100)                NOT NULL,
    action          VARCHAR(80)                 NOT NULL,
    target_entity   VARCHAR(100),
    target_id       VARCHAR(100),
    timestamp       TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    metadata        TEXT,
    ip_address      VARCHAR(50),
    user_agent      TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id      ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action        ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp     ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_entity ON audit_logs(target_entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id     ON audit_logs(target_id);

-- 3. Permissions reference table (static, managed by code)
CREATE TABLE IF NOT EXISTS permissions (
    code        VARCHAR(60) PRIMARY KEY,
    description VARCHAR(255)
);

INSERT INTO permissions (code, description) VALUES
    ('USER_VIEW',   'View users and their details'),
    ('USER_CREATE', 'Create new users'),
    ('USER_UPDATE', 'Update user information'),
    ('USER_DELETE', 'Deactivate/delete users'),
    ('ROLE_MANAGE', 'Assign and manage roles')
ON CONFLICT (code) DO NOTHING;

-- 4. Role–Permission mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
    role        VARCHAR(60)  NOT NULL,
    permission  VARCHAR(60)  NOT NULL REFERENCES permissions(code),
    PRIMARY KEY (role, permission)
);

INSERT INTO role_permissions (role, permission) VALUES
    ('SUPER_ADMIN', 'USER_VIEW'),
    ('SUPER_ADMIN', 'USER_CREATE'),
    ('SUPER_ADMIN', 'USER_UPDATE'),
    ('SUPER_ADMIN', 'USER_DELETE'),
    ('SUPER_ADMIN', 'ROLE_MANAGE'),
    ('ADMIN',       'USER_VIEW'),
    ('ADMIN',       'USER_CREATE'),
    ('ADMIN',       'USER_UPDATE'),
    ('ADMIN',       'USER_DELETE'),
    ('OPERATOR',    'USER_VIEW'),
    ('READONLY',    'USER_VIEW')
ON CONFLICT DO NOTHING;
