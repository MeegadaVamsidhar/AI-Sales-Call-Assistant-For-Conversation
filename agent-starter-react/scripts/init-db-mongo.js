const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function initializeDatabase() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'agent_starter_db';

  let client;

  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    console.log('✅ Connected to MongoDB');

    // Create collections with validation
    console.log('📋 Creating users collection...');
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'passwordHash', 'emailVerified', 'createdAt', 'updatedAt'],
          properties: {
            email: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              description: 'Email must be a valid email address',
            },
            passwordHash: {
              bsonType: 'string',
              description: 'Password hash is required',
            },
            emailVerified: {
              bsonType: 'bool',
              description: 'Email verification status is required',
            },
            emailVerificationToken: {
              bsonType: ['string', 'null'],
              description: 'Email verification token',
            },
            emailVerificationExpires: {
              bsonType: ['date', 'null'],
              description: 'Email verification expiration',
            },
            passwordResetToken: {
              bsonType: ['string', 'null'],
              description: 'Password reset token',
            },
            passwordResetExpires: {
              bsonType: ['date', 'null'],
              description: 'Password reset expiration',
            },
            createdAt: {
              bsonType: 'date',
              description: 'Creation date is required',
            },
            updatedAt: {
              bsonType: 'date',
              description: 'Last update date is required',
            },
          },
        },
      },
    });

    console.log('📋 Creating user_sessions collection...');
    await db.createCollection('user_sessions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'ipAddress', 'attempts', 'lastAttempt', 'createdAt'],
          properties: {
            userId: {
              bsonType: 'objectId',
              description: 'User ID is required',
            },
            ipAddress: {
              bsonType: 'string',
              description: 'IP address is required',
            },
            userAgent: {
              bsonType: ['string', 'null'],
              description: 'User agent string',
            },
            attempts: {
              bsonType: 'int',
              minimum: 0,
              description: 'Number of attempts must be non-negative',
            },
            lastAttempt: {
              bsonType: 'date',
              description: 'Last attempt date is required',
            },
            lockedUntil: {
              bsonType: ['date', 'null'],
              description: 'Lockout expiration',
            },
            createdAt: {
              bsonType: 'date',
              description: 'Creation date is required',
            },
          },
        },
      },
    });

    // Create indexes for better performance
    console.log('📋 Creating indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ emailVerificationToken: 1 });
    await db.collection('users').createIndex({ passwordResetToken: 1 });
    await db.collection('users').createIndex({ createdAt: 1 });

    await db.collection('user_sessions').createIndex({ userId: 1 });
    await db.collection('user_sessions').createIndex({ ipAddress: 1 });
    await db.collection('user_sessions').createIndex({ lastAttempt: 1 });
    await db.collection('user_sessions').createIndex({ lockedUntil: 1 });

    console.log('✅ MongoDB database initialized successfully!');
    console.log('📊 Collections created:');
    console.log('   - users (user accounts and authentication)');
    console.log('   - user_sessions (rate limiting and sessions)');
    console.log('🔗 You can now start your application with: npm run dev');
  } catch (error) {
    console.error('❌ MongoDB initialization failed:', error.message);
    console.error('💡 Make sure:');
    console.error('   1. MongoDB is running');
    console.error('   2. Connection string is correct');
    console.error('   3. Database permissions are set');
    console.error('   4. DATABASE_URL is correct in .env.local');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

initializeDatabase();
