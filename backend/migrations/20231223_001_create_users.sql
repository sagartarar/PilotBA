-- Migration: Create users table and authentication infrastructure
-- Created: 2025-12-23
-- Author: Handyman

-- Create user role enum
CREATE TYPE user_role AS ENUM ('admin', 'user', 'readonly');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create refresh token blacklist table
-- Used to invalidate refresh tokens on logout
CREATE TABLE IF NOT EXISTS revoked_tokens (
    token_hash VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user (password: admin123)
-- Password hash generated with Argon2
-- Note: This is for development only. Remove in production or change password.
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'admin@pilotba.com',
    '$argon2id$v=19$m=19456,t=2,p=1$8RzBrXKrHR5p3lMn3pEJoA$rqPiKhLFP7Ao9bYBf5ThBpx8qKYL5rZ0Z8g7nSvNhYg',
    'Admin User',
    'admin'
) ON CONFLICT (email) DO NOTHING;

