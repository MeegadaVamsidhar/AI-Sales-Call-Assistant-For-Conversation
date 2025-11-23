import { Db, MongoClient } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'agent_starter_db';

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);

    console.log('✅ Connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Database schema initialization
export async function initializeDatabase() {
  try {
    const { db } = await connectToDatabase();

    // Create collections with validation
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
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ emailVerificationToken: 1 });
    await db.collection('users').createIndex({ passwordResetToken: 1 });
    await db.collection('users').createIndex({ createdAt: 1 });

    await db.collection('user_sessions').createIndex({ userId: 1 });
    await db.collection('user_sessions').createIndex({ ipAddress: 1 });
    await db.collection('user_sessions').createIndex({ lastAttempt: 1 });
    await db.collection('user_sessions').createIndex({ lockedUntil: 1 });

    console.log('✅ MongoDB database initialized successfully');
    console.log('📊 Collections created:');
    console.log('   - users (user accounts and authentication)');
    console.log('   - user_sessions (rate limiting and sessions)');
  } catch (error) {
    console.error('❌ MongoDB initialization failed:', error);
    throw error;
  }
}

// Helper function to execute queries with error handling
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function query(collectionName: string, operation: string, ...args: any[]) {
  const db = await getDatabase();
  const collection = db.collection(collectionName);

  try {
    const start = Date.now();
    let result;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    switch (operation) {
      case 'insertOne':
        result = await collection.insertOne(args[0] as any);
        break;
      case 'insertMany':
        result = await collection.insertMany(args[0] as any);
        break;
      case 'findOne':
        result = await collection.findOne(args[0] as any, args[1] as any);
        break;
      case 'find':
        result = await collection.find(args[0] as any, args[1] as any).toArray();
        break;
      case 'updateOne':
        result = await collection.updateOne(args[0] as any, args[1] as any, args[2] as any);
        break;
      case 'updateMany':
        result = await collection.updateMany(args[0] as any, args[1] as any, args[2] as any);
        break;
      case 'deleteOne':
        result = await collection.deleteOne(args[0] as any);
        break;
      case 'deleteMany':
        result = await collection.deleteMany(args[0] as any);
        break;
      case 'countDocuments':
        result = await collection.countDocuments(args[0] as any);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    const duration = Date.now() - start;
    console.log('📊 MongoDB query executed', { collection: collectionName, operation, duration });
    return result;
  } catch (error) {
    console.error('❌ MongoDB query error:', error);
    throw error;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
