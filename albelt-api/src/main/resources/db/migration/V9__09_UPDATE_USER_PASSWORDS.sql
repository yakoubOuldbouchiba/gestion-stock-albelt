-- ============================================================================
-- Migration V9: Update User Password Hashes
-- Date: 2026-03-28
-- Description: Fix user passwords with correct bcrypt hashes (cost factor 10)
--              matching Spring Security BCryptPasswordEncoder configuration
-- ============================================================================

-- Update admin user with password: admin123
UPDATE users
SET password_hash = '$2a$10$ITSy11J3mCW72hY0iXwe0eTFXu1CN/M1VjV1u6.DB2CwZpwzYVD8G'
WHERE username = 'admin';

-- Update ahmed.operator with password: operator123
UPDATE users
SET password_hash = '$2a$10$q9KzDB.YNhO00XnIhkGBqORTN0k0U/xa8M9oxzXiRmeUcDZSedc/2'
WHERE username = 'ahmed.operator';

-- Update fatima.operator with password: operator123
UPDATE users
SET password_hash = '$2a$10$q9KzDB.YNhO00XnIhkGBqORTN0k0U/xa8M9oxzXiRmeUcDZSedc/2'
WHERE username = 'fatima.operator';

-- Update manager.report with password: test123
UPDATE users
SET password_hash = '$2a$10$kpgSIH9TQ01TWz40DPRERukvzHrC3Eo/Oql5NlePJw8Zi2/TUuvVO'
WHERE username = 'manager.report';
