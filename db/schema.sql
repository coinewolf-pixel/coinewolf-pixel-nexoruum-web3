-- NEXORUM OS Web3 Application Module Schema
-- Compatible with PostgreSQL, SQLite, and Cloudflare D1

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    telegram_id VARCHAR(64) UNIQUE,
    telegram_username VARCHAR(64),
    email VARCHAR(128) UNIQUE,
    phone VARCHAR(32),
    username VARCHAR(64) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(32) NOT NULL DEFAULT 'USER',
    referral_code VARCHAR(32) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_wallets (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(128) NOT NULL,
    network VARCHAR(32) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    provider_name VARCHAR(64) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    balance_usd NUMERIC(18, 2) DEFAULT 0.00,
    native_balance VARCHAR(64) DEFAULT '0',
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_address UNIQUE (user_id, address, network)
);

CREATE TABLE IF NOT EXISTS tokens (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    network VARCHAR(32) NOT NULL,
    standard VARCHAR(32) NOT NULL,
    decimals INT NOT NULL DEFAULT 18,
    total_supply VARCHAR(64) NOT NULL,
    contract_address VARCHAR(128) NOT NULL UNIQUE,
    owner_address VARCHAR(128) NOT NULL,
    owner_user_id VARCHAR(64) REFERENCES users(id),
    logo_url TEXT,
    price_usd NUMERIC(18, 8) DEFAULT 0.0,
    price_change_24h NUMERIC(8, 2) DEFAULT 0.0,
    market_cap_usd NUMERIC(18, 2) DEFAULT 0.0,
    volume_24h_usd NUMERIC(18, 2) DEFAULT 0.0,
    liquidity_pool_address VARCHAR(128),
    is_hot BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_items (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL,
    price NUMERIC(18, 4) NOT NULL,
    price_symbol VARCHAR(16) NOT NULL DEFAULT 'USDT',
    network VARCHAR(32) NOT NULL,
    seller_id VARCHAR(64) NOT NULL REFERENCES users(id),
    seller_address VARCHAR(128) NOT NULL,
    seller_name VARCHAR(128) NOT NULL,
    image_url TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    sales_count INT DEFAULT 0,
    verified BOOLEAN DEFAULT TRUE,
    payload_data JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id),
    hash VARCHAR(128) NOT NULL UNIQUE,
    network VARCHAR(32) NOT NULL,
    type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
    amount VARCHAR(64) NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    amount_usd NUMERIC(18, 2) DEFAULT 0.00,
    from_address VARCHAR(128) NOT NULL,
    to_address VARCHAR(128) NOT NULL,
    block_number BIGINT NOT NULL,
    gas_fee_usd NUMERIC(8, 4) DEFAULT 0.15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(128) PRIMARY KEY,
    value JSON NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    status VARCHAR(16) NOT NULL DEFAULT 'SUCCESS',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
