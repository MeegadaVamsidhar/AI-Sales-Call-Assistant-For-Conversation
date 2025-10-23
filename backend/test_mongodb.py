#!/usr/bin/env python3
"""
MongoDB Connection Test Script
This script tests the MongoDB connection and helps diagnose issues.
"""

import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_mongodb_connection():
    """Test MongoDB connection and create test data"""
    try:
        # Get connection details
        mongo_url = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "agent_starter_db")
        
        logger.info(f"Testing MongoDB connection...")
        logger.info(f"URL: {mongo_url}")
        logger.info(f"Database: {db_name}")
        
        # Create client with timeout
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        logger.info("✅ Successfully connected to MongoDB!")
        
        # Test collections
        transcripts_collection = db.transcripts
        orders_collection = db.orders
        feedback_collection = db.feedback
        
        # Create indexes
        logger.info("Creating indexes...")
        await transcripts_collection.create_index("room_id")
        await transcripts_collection.create_index("timestamp")
        await orders_collection.create_index("room_id")
        await orders_collection.create_index("customer_id")
        await feedback_collection.create_index("room_id")
        logger.info("✅ Indexes created successfully!")
        
        # Insert test transcript
        test_transcript = {
            "id": "test_001",
            "role": "user",
            "message": "Hello, I want to order a book called 'The Great Gatsby' by F. Scott Fitzgerald",
            "timestamp": 1697875200.0,
            "room_id": "test_room_001",
            "created_at": 1697875200.0
        }
        
        result = await transcripts_collection.insert_one(test_transcript)
        logger.info(f"✅ Test transcript inserted with ID: {result.inserted_id}")
        
        # Insert test order
        test_order = {
            "room_id": "test_room_001",
            "order_id": "ORD-20241020-TEST001",
            "customer_id": "1234567890",
            "customer_name": "John Doe",
            "book_title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "genre": "fiction",
            "quantity": 1,
            "unit_price": 15.99,
            "total_amount": 15.99,
            "payment_method": "credit card",
            "delivery_option": "home_delivery",
            "order_status": "pending",
            "special_requests": "Please handle with care"
        }
        
        result = await orders_collection.replace_one(
            {"room_id": "test_room_001"}, 
            test_order, 
            upsert=True
        )
        logger.info(f"✅ Test order inserted/updated")
        
        # Check data
        transcript_count = await transcripts_collection.count_documents({})
        order_count = await orders_collection.count_documents({})
        
        logger.info(f"📊 Database Statistics:")
        logger.info(f"   - Transcripts: {transcript_count}")
        logger.info(f"   - Orders: {order_count}")
        
        # List all collections
        collections = await db.list_collection_names()
        logger.info(f"📁 Collections: {collections}")
        
        # Close connection
        client.close()
        logger.info("✅ MongoDB test completed successfully!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        logger.error("💡 Possible solutions:")
        logger.error("   1. Make sure MongoDB is running locally")
        logger.error("   2. Check if MongoDB service is started")
        logger.error("   3. Verify connection string in .env file")
        logger.error("   4. For Windows: Run 'net start MongoDB' as administrator")
        logger.error("   5. Install MongoDB Community Server if not installed")
        return False

def check_environment():
    """Check environment configuration"""
    logger.info("🔍 Checking environment configuration...")
    
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        logger.info(f"✅ .env file found: {env_file}")
    else:
        logger.warning(f"⚠️  .env file not found: {env_file}")
    
    mongo_url = os.getenv("DATABASE_URL")
    db_name = os.getenv("DB_NAME")
    
    logger.info(f"DATABASE_URL: {mongo_url or 'Not set (using default)'}")
    logger.info(f"DB_NAME: {db_name or 'Not set (using default)'}")

def check_dependencies():
    """Check if required packages are installed"""
    logger.info("📦 Checking dependencies...")
    
    required_packages = ['motor', 'pymongo', 'python-dotenv', 'fastapi']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            logger.info(f"✅ {package} is installed")
        except ImportError:
            missing_packages.append(package)
            logger.error(f"❌ {package} is missing")
    
    if missing_packages:
        logger.error("💡 Install missing packages with:")
        logger.error(f"   pip install {' '.join(missing_packages)}")
        return False
    
    return True

async def main():
    """Main test function"""
    print("🔧 MongoDB Connection Diagnostic Tool")
    print("=" * 50)
    
    # Check environment
    check_environment()
    print()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    print()
    
    # Test MongoDB connection
    success = await test_mongodb_connection()
    
    print()
    print("=" * 50)
    if success:
        print("🎉 All tests passed! MongoDB is working correctly.")
        print("💡 You should now see data in MongoDB Compass at:")
        print("   - Connection: mongodb://localhost:27017")
        print("   - Database: agent_starter_db")
        print("   - Collections: transcripts, orders, feedback")
    else:
        print("❌ Tests failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
