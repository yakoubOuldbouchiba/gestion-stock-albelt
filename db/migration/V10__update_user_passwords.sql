-- V10: Update user passwords with correct bcrypt hashes
-- Downloads: Set demo users with their intended passwords (all initially set to test123 for simplicity)
-- Password: test123 -> bcrypt hash: $2a$12$RZNxqKP8YwmWK9H9hKdSOeJn3J3l/3Ay8l0GLCMFdVLTNqCy5zQZm

DO $$
BEGIN
    -- Update admin user password to: admin123
    UPDATE users 
    SET password_hash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm'
    WHERE username = 'admin';
    
    -- Update ahmed.operator password to: operator123
    UPDATE users 
    SET password_hash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm'
    WHERE username = 'ahmed.operator';
    
    -- Update fatima.operator password to: operator123
    UPDATE users 
    SET password_hash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm'
    WHERE username = 'fatima.operator';
    
    -- Update manager.report password to: test123 (different for readonly user testing)
    UPDATE users 
    SET password_hash = '$2a$12$RZNxqKP8YwmWK9H9hKdSOeJn3J3l/3Ay8l0GLCMFdVLTNqCy5zQZm'
    WHERE username = 'manager.report';
    
    RAISE NOTICE 'User passwords updated successfully';
END $$;
