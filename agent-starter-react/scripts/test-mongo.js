const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testMongoConnection() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'agent_starter_db';

  console.log('🔍 Testing MongoDB connection...');
  console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('📋 DB_NAME:', process.env.DB_NAME || 'agent_starter_db');

  let client;

  try {
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    console.log('✅ MongoDB connection successful!');

    // Test a simple operation
    const collections = await db.listCollections().toArray();
    console.log(
      '📊 Available collections:',
      collections.map((c) => c.name)
    );

    // Test database info
    const adminDb = client.db().admin();
    const serverInfo = await adminDb.serverStatus();
    console.log('📊 MongoDB version:', serverInfo.version);

    console.log('🎉 MongoDB is ready for initialization!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Troubleshooting:');
    console.error('   1. Make sure MongoDB is running');
    console.error('   2. Check if MongoDB service is started');
    console.error('   3. Verify connection string in .env.local');
    console.error('   4. For local development, use: mongodb://localhost:27017');
    console.error('');
    console.error('🚀 To start MongoDB:');
    console.error('   - Windows: net start MongoDB');
    console.error('   - macOS: brew services start mongodb-community');
    console.error('   - Linux: sudo systemctl start mongod');
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testMongoConnection();
