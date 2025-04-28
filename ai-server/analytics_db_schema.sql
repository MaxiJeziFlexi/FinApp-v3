-- PostgreSQL schema for analytics data

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    age INTEGER,
    country VARCHAR(50),
    monthly_income NUMERIC(12, 2),
    monthly_expenses NUMERIC(12, 2),
    financial_goal TEXT,
    risk_tolerance VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial analytics table
CREATE TABLE IF NOT EXISTS financial_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    income NUMERIC(12, 2) NOT NULL,
    expenses NUMERIC(12, 2) NOT NULL,
    assets_value NUMERIC(12, 2) NOT NULL,
    trend VARCHAR(20) NOT NULL,
    liquidity NUMERIC(12, 2) NOT NULL,
    savings_progress NUMERIC(5, 2) NOT NULL,
    suggestion TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Investment data table
CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    current_value NUMERIC(12, 2) NOT NULL,
    initial_value NUMERIC(12, 2) NOT NULL,
    acquisition_date DATE NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    expected_return NUMERIC(5, 2) NOT NULL,
    actual_return NUMERIC(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Financial goals table
CREATE TABLE IF NOT EXISTS financial_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    target_date DATE NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- AI chat history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    transaction_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_analytics_user_id ON financial_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_user_profiles_modtime
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_investments_modtime
    BEFORE UPDATE ON investments
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_financial_goals_modtime
    BEFORE UPDATE ON financial_goals
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();