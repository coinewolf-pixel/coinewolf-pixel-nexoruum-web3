-- Migration 0001: Indexes & Initial Constraints for NEXORUM OS Web3 Module

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(address);

CREATE INDEX IF NOT EXISTS idx_tokens_network ON tokens(network);
CREATE INDEX IF NOT EXISTS idx_tokens_contract ON tokens(contract_address);
CREATE INDEX IF NOT EXISTS idx_tokens_owner_user_id ON tokens(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_items(seller_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
