-- Schema for SpendTracker (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL DEFAULT '#6366F1',
    icon VARCHAR(50) DEFAULT 'Tag',
    monthly_budget NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_category UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1,
    match_type VARCHAR(20) DEFAULT 'contains',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    raw_description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_manually_assigned BOOLEAN DEFAULT FALSE,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Core Portfolio Index: Highly optimized for range queries filtering by user and date
CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred 
    ON transactions (user_id, occurred_at DESC);

-- Secondary Index for category aggregations and joins
CREATE INDEX IF NOT EXISTS idx_transactions_user_cat 
    ON transactions (user_id, category_id);

-- Rules indexing for fast auto-categorization lookup
CREATE INDEX IF NOT EXISTS idx_rules_user_priority 
    ON rules (user_id, priority DESC);
