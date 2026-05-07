-- V52: Fix super_admin password hash
-- Password: SuperAdmin2026!  (BCrypt 12 rounds, $2b prefix)
UPDATE users
SET password_hash = '$2b$12$8qhICwwnWc9Cv0fp2HNbK.apiWQ2BR1E/F4iLGbEJ4lQJYbHc6kcG',
    updated_at    = NOW()
WHERE username = 'super_admin';
