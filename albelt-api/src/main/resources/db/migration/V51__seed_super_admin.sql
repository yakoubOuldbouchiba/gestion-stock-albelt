-- V51: Seed SUPER_ADMIN demo user
-- Password: SuperAdmin2026!   (BCrypt 12 rounds)
-- Change this password immediately in production!

INSERT INTO users (id, username, email, password_hash, role, full_name, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'super_admin',
  'super_admin@albelt.local',
  '$2a$12$Eol5Gi.bwY3CIb2pn5xsVuwWi3JE5t6DqEQjbWJZ8A7I7.YKP4sW6',
  'SUPER_ADMIN',
  'Super Administrator',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;
