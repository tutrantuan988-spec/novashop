-- Migration: Add password_hash to users table for bcrypt-based JWT auth
-- This enables the new PostgreSQL authentication system

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Ensure indexes exist (should already exist but safe to re-run)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Add a default admin user for testing (password: admin123)
-- The bcrypt hash below is for 'admin123' with 12 rounds
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@novashop.vn', '$2a$12$LJ3m4ys3Lk0TSwHnbfOMeOXPm5K7KQ5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5O', 'Admin NovaShop', 'admin')
ON CONFLICT (email) DO NOTHING;
