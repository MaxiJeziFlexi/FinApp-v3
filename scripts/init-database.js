#!/usr/bin/env node

/**
 * Database Initialization Script
 * This script initializes the PostgreSQL database with the required schema
 * for the AI Chat Financial Advisory System
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finapp',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
};

console.log('🚀 Starting database initialization...');
console.log(`📊 Connecting to database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);

async function initializeDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded successfully');
    
    // Execute schema
    console.log('🔧 Executing database schema...');
    await client.query(schema);
    console.log('✅ Database schema executed successfully');
    
    // Insert sample user for testing
    console.log('👤 Creating sample user...');
    await client.query(`
      INSERT INTO users (id, email, password_hash, first_name, status, is_premium) 
      VALUES (1, 'test@example.com', 'hashed_password', 'Test User', 'active', false)
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert sample user profile
    await client.query(`
      INSERT INTO user_profiles (
        user_id, 
        financial_goal, 
        timeframe, 
        monthly_income, 
        current_savings, 
        target_amount,
        onboarding_complete,
        progress_percentage,
        data_processing_consent,
        profiling_consent,
        financial_data
      ) VALUES (
        1, 
        'emergency_fund', 
        'medium', 
        '4000_6000', 
        '5000_10000', 
        12000.00,
        false,
        0,
        true,
        false,
        '[
          {"date": "2023-01", "amount": 2000},
          {"date": "2023-02", "amount": 2500},
          {"date": "2023-03", "amount": 3000},
          {"date": "2023-04", "amount": 3200},
          {"date": "2023-05", "amount": 3800},
          {"date": "2023-06", "amount": 4200},
          {"date": "2023-07", "amount": 4500},
          {"date": "2023-08", "amount": 5000}
        ]'::jsonb
      )
      ON CONFLICT (user_id) DO NOTHING
    `);
    
    console.log('✅ Sample data inserted successfully');
    
    // Verify tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Verify functions
    const functionsResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `);
    
    console.log('⚙️  Created functions:');
    functionsResult.rows.forEach(row => {
      console.log(`   - ${row.routine_name}`);
    });
    
    client.release();
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✨ All done! Your database is ready to use.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };