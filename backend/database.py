import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import logging
from typing import Dict, List
from collections import defaultdict
from datetime import datetime

logger = logging.getLogger(__name__)

class MongoDBService:
    def __init__(self):
        self.client = None
        self.db = None
        self.transcripts_collection = None
        self.orders_collection = None
        self.feedback_collection = None
        self.admins_collection = None
        self.use_memory = False
        # In-memory fallback storage
        self._memory_transcripts: Dict[str, List[dict]] = defaultdict(list)
        self._memory_orders: Dict[str, dict] = {}
        self._memory_feedback: List[dict] = []
        self._memory_admins: List[dict] = []
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            # Get connection string from environment
            mongo_url = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
            db_name = os.getenv("DB_NAME", "agent_starter_db")
            
            logger.info(f"Attempting to connect to MongoDB...")
            logger.info(f"URL: {mongo_url}")
            logger.info(f"Database: {db_name}")
            
            self.client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=10000)
            self.db = self.client[db_name]
            
            # Collections
            self.transcripts_collection = self.db.transcripts
            self.orders_collection = self.db.orders
            self.feedback_collection = self.db.feedback
            self.admins_collection = self.db.admins
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"✅ Successfully connected to MongoDB: {db_name}")
            
            # Create indexes
            logger.info("Creating database indexes...")
            await self.transcripts_collection.create_index("room_id")
            await self.transcripts_collection.create_index("timestamp")
            await self.orders_collection.create_index("room_id")
            await self.orders_collection.create_index("customer_id")
            await self.feedback_collection.create_index("room_id")
            await self.feedback_collection.create_index("customer_id")
            await self.feedback_collection.create_index("feedback_date")
            
            # Clean up existing admin records with null employee_id to fix duplicate key issues
            try:
                # Remove admin records that have null employee_id (except the first one)
                admins_with_null = await self.admins_collection.find({"employee_id": None}).to_list(length=None)
                if len(admins_with_null) > 1:
                    # Keep only the first admin with null employee_id, delete the rest
                    ids_to_delete = [admin["_id"] for admin in admins_with_null[1:]]
                    if ids_to_delete:
                        result = await self.admins_collection.delete_many({"_id": {"$in": ids_to_delete}})
                        logger.info(f"Cleaned up {result.deleted_count} duplicate admin records with null employee_id")
            except Exception as e:
                logger.warning(f"Failed to clean up duplicate admin records: {e}")
            
            # Drop existing employee_id index if it exists - we'll handle uniqueness in application logic
            try:
                await self.admins_collection.drop_index("employee_id_1")
                logger.info("Dropped existing employee_id index")
            except Exception:
                pass  # Index might not exist
            
            # Create non-unique index for employee_id for performance (uniqueness handled in app logic)
            await self.admins_collection.create_index("employee_id")
            await self.admins_collection.create_index("email", unique=True)
            await self.admins_collection.create_index("created_at")
            logger.info("✅ Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            logger.error("💡 Possible solutions:")
            logger.error("   1. Make sure MongoDB is running locally")
            logger.error("   2. Check if MongoDB service is started")
            logger.error("   3. Verify connection string in .env file")
            logger.error("   4. For Windows: Run 'net start MongoDB' as administrator")
            logger.warning("⚠️  Using in-memory storage (data will not persist)")
            self.use_memory = True
            self.client = None
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def store_transcript(self, room_id: str, transcript_data: dict):
        """Store a transcript item"""
        try:
            if self.use_memory:
                transcript_data["room_id"] = room_id
                self._memory_transcripts[room_id].append(transcript_data)
                logger.info(f"📝 Stored transcript in MEMORY for room {room_id} (message: {transcript_data.get('message', '')[:50]}...)")
                return f"memory_{len(self._memory_transcripts[room_id])}"
            else:
                transcript_data["room_id"] = room_id
                result = await self.transcripts_collection.insert_one(transcript_data)
                logger.info(f"📝 Stored transcript in MONGODB {result.inserted_id} for room {room_id} (message: {transcript_data.get('message', '')[:50]}...)")
                return result.inserted_id
        except Exception as e:
            logger.error(f"❌ Failed to store transcript: {e}")
            raise
    
    async def get_transcripts(self, room_id: str):
        """Get all transcripts for a room"""
        try:
            if self.use_memory:
                return sorted(self._memory_transcripts.get(room_id, []), key=lambda x: x.get("timestamp", 0))
            else:
                cursor = self.transcripts_collection.find({"room_id": room_id}).sort("timestamp", 1)
                transcripts = await cursor.to_list(length=None)
                return transcripts
        except Exception as e:
            logger.error(f"Failed to get transcripts: {e}")
            raise
    
    async def store_order(self, room_id: str, order_data: dict):
        """Store or update order data for a room"""
        try:
            if self.use_memory:
                order_data["room_id"] = room_id
                self._memory_orders[room_id] = order_data
                logger.info(f"Stored order in memory for room {room_id}")
                return 1
            else:
                order_data["room_id"] = room_id
                result = await self.orders_collection.replace_one(
                    {"room_id": room_id}, 
                    order_data, 
                    upsert=True
                )
                logger.info(f"Stored order for room {room_id}")
                return result.upserted_id or result.matched_count
        except Exception as e:
            logger.error(f"Failed to store order: {e}")
            raise
    
    async def get_order(self, room_id: str):
        """Get order data for a room"""
        try:
            if self.use_memory:
                return self._memory_orders.get(room_id)
            else:
                order = await self.orders_collection.find_one({"room_id": room_id})
                return order
        except Exception as e:
            logger.error(f"Failed to get order: {e}")
            raise
    
    async def store_feedback(self, feedback_data: dict):
        """Store feedback data"""
        try:
            if self.use_memory:
                self._memory_feedback.append(feedback_data)
                logger.info(f"Stored feedback in memory: {feedback_data.get('feedback_id')}")
                return len(self._memory_feedback)
            else:
                result = await self.feedback_collection.insert_one(feedback_data)
                logger.info(f"Stored feedback {result.inserted_id}")
                return result.inserted_id
        except Exception as e:
            logger.error(f"Failed to store feedback: {e}")
            raise
    
    async def get_all_feedback(self):
        """Get all feedback data"""
        try:
            if self.use_memory:
                return sorted(self._memory_feedback, key=lambda x: x.get("feedback_date", ""), reverse=True)
            else:
                cursor = self.feedback_collection.find({}).sort("feedback_date", -1)
                feedback = await cursor.to_list(length=None)
                return feedback
        except Exception as e:
            logger.error(f"Failed to get all feedback: {e}")
            raise
    
    async def get_feedback_by_room(self, room_id: str):
        """Get feedback for a specific room"""
        try:
            if self.use_memory:
                return [f for f in self._memory_feedback if f.get("room_id") == room_id]
            else:
                cursor = self.feedback_collection.find({"room_id": room_id}).sort("feedback_date", -1)
                feedback = await cursor.to_list(length=None)
                return feedback
        except Exception as e:
            logger.error(f"Failed to get room feedback: {e}")
            raise
    
    async def get_feedback_by_customer(self, customer_id: str):
        """Get feedback for a specific customer"""
        try:
            if self.use_memory:
                return [f for f in self._memory_feedback if f.get("customer_id") == customer_id]
            else:
                cursor = self.feedback_collection.find({"customer_id": customer_id}).sort("feedback_date", -1)
                feedback = await cursor.to_list(length=None)
                return feedback
        except Exception as e:
            logger.error(f"Failed to get customer feedback: {e}")
            raise

    # Admin Management Methods
    async def create_admin(self, admin_data: dict):
        """Create a new admin account"""
        try:
            if self.use_memory:
                # Check if email already exists (employee_id is None during registration)
                for admin in self._memory_admins:
                    if admin.get("email") == admin_data.get("email"):
                        raise Exception("Email already exists")
                    # Only check employee_id if it's not None
                    if admin_data.get("employee_id") and admin.get("employee_id") == admin_data.get("employee_id"):
                        raise Exception("Employee ID already exists")
                
                admin_data["admin_id"] = str(len(self._memory_admins) + 1)
                self._memory_admins.append(admin_data)
                logger.info(f"Created admin in memory: {admin_data.get('employee_id')}")
                return admin_data["admin_id"]
            else:
                # Check if employee_id already exists (only if not None)
                if admin_data.get("employee_id"):
                    existing_employee = await self.admins_collection.find_one({"employee_id": admin_data.get("employee_id")})
                    if existing_employee:
                        raise Exception("Employee ID already exists")
                
                result = await self.admins_collection.insert_one(admin_data)
                logger.info(f"Created admin {result.inserted_id}")
                return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Failed to create admin: {e}")
            raise

    async def get_admin_by_employee_id(self, employee_id: str):
        """Get admin by employee ID"""
        try:
            if self.use_memory:
                for admin in self._memory_admins:
                    if admin.get("employee_id") == employee_id:
                        return admin
                return None
            else:
                admin = await self.admins_collection.find_one({"employee_id": employee_id})
                return admin
        except Exception as e:
            logger.error(f"Failed to get admin by employee ID: {e}")
            raise

    async def get_admin_by_email(self, email: str):
        """Get admin by email"""
        try:
            if self.use_memory:
                for admin in self._memory_admins:
                    if admin.get("email") == email:
                        return admin
                return None
            else:
                admin = await self.admins_collection.find_one({"email": email})
                return admin
        except Exception as e:
            logger.error(f"Failed to get admin by email: {e}")
            raise

    async def update_admin_last_login(self, employee_id: str, last_login: str):
        """Update admin's last login timestamp"""
        try:
            if self.use_memory:
                for admin in self._memory_admins:
                    if admin.get("employee_id") == employee_id:
                        admin["last_login"] = last_login
                        return True
                return False
            else:
                result = await self.admins_collection.update_one(
                    {"employee_id": employee_id},
                    {"$set": {"last_login": last_login}}
                )
                return result.modified_count > 0
        except Exception as e:
            logger.error(f"Failed to update admin last login: {e}")
            raise

    async def get_all_admins(self):
        """Get all admin accounts"""
        try:
            if self.use_memory:
                return sorted(self._memory_admins, key=lambda x: x.get("created_at", ""), reverse=True)
            else:
                cursor = self.admins_collection.find({}).sort("created_at", -1)
                admins = await cursor.to_list(length=None)
                return admins
        except Exception as e:
            logger.error(f"Failed to get all admins: {e}")
            raise

    async def get_all_orders(self):
        """Get all orders from all rooms"""
        try:
            if self.use_memory:
                return list(self._memory_orders.values())
            else:
                cursor = self.orders_collection.find({}).sort("order_date", -1)
                orders = await cursor.to_list(length=None)
                return orders
        except Exception as e:
            logger.error(f"Failed to get all orders: {e}")
            raise

    async def update_admin_verification(self, verification_token: str, email_verified: bool = True, status: str = "active", employee_id: str = None):
        """Update admin verification status using verification token"""
        try:
            if self.use_memory:
                for admin in self._memory_admins:
                    if admin.get("email_verification_token") == verification_token:
                        admin["email_verified"] = email_verified
                        admin["status"] = status
                        admin["email_verification_token"] = None
                        admin["email_verification_expires"] = None
                        admin["updated_at"] = datetime.now().isoformat()
                        if employee_id:
                            admin["employee_id"] = employee_id
                        return admin
                return None
            else:
                update_data = {
                    "email_verified": email_verified,
                    "status": status,
                    "email_verification_token": None,
                    "email_verification_expires": None,
                    "updated_at": datetime.now()
                }
                if employee_id:
                    update_data["employee_id"] = employee_id
                
                result = await self.admins_collection.find_one_and_update(
                    {"email_verification_token": verification_token},
                    {"$set": update_data},
                    return_document=True
                )
                return result
        except Exception as e:
            logger.error(f"Failed to update admin verification: {e}")
            raise

    async def get_admin_by_verification_token(self, verification_token: str):
        """Get admin by verification token"""
        try:
            if self.use_memory:
                for admin in self._memory_admins:
                    if admin.get("email_verification_token") == verification_token:
                        return admin
                return None
            else:
                admin = await self.admins_collection.find_one({"email_verification_token": verification_token})
                return admin
        except Exception as e:
            logger.error(f"Failed to get admin by verification token: {e}")
            raise

# Global database service instance
db_service = MongoDBService()