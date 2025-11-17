-- Create users table for OAuth authentication
-- This table stores user information from Google OAuth

CREATE TABLE IF NOT EXISTS users (
    userid SERIAL PRIMARY KEY,
    googleid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    role VARCHAR(50) DEFAULT 'employee',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on googleid for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_googleid ON users(googleid);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

