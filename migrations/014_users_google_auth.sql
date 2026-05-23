-- Migration: Add Google Auth columns to users table
-- Enables Firebase/Google OAuth integration

ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Index for faster Google Auth lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users (firebase_uid);
