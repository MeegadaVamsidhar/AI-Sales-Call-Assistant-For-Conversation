const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing database connection...');
console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');

    // Test a simple query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);

    client.release();
    console.log('🎉 Database is ready for initialization!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Troubleshooting:');
    console.error('   1. Make sure PostgreSQL is running');
    console.error('   2. Check if database "agent_starter_db" exists');
    console.error('   3. Verify user "vamsi" exists with password "vamsi123"');
    console.error('   4. Check your DATABASE_URL in .env.local');
  } finally {
    await pool.end();
  }
}

testConnection();
