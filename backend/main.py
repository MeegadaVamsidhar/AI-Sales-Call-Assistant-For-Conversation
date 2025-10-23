from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal
from datetime import datetime, timedelta
from dotenv import load_dotenv
from database import db_service
import logging
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import hashlib
import secrets
import pandas as pd
from io import BytesIO
import uuid

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# LiveKit API - Optional import
try:
    from livekit.api import AccessToken, VideoGrants
    LIVEKIT_AVAILABLE = True
except ImportError:
    logging.warning("LiveKit API not available. Token generation will be disabled.")
    LIVEKIT_AVAILABLE = False
    AccessToken = None
    VideoGrants = None

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "YOUR_LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "YOUR_LIVEKIT_API_SECRET")

# Email Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "meegadavamsi76@gmail.com")

class TokenRequest(BaseModel):
    room_name: str
    identity: str



class TranscriptItem(BaseModel):
    id: str
    role: Literal["assistant", "user"]
    message: str
    timestamp: float


class ProcessTranscriptionRequest(BaseModel):
    room_id: str = Field(..., description="LiveKit room id")
    item: TranscriptItem


class OrderData(BaseModel):
    order_id: Optional[str] = None
    customer_id: Optional[str] = None  # This will be the contact number
    customer_name: Optional[str] = None
    book_title: Optional[str] = None
    author: Optional[str] = None
    genre: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    payment_method: Optional[str] = None
    delivery_option: Optional[str] = None
    delivery_address: Optional[str] = None
    order_status: str = "pending"
    order_date: Optional[datetime] = None
    special_requests: Optional[str] = None

class FeedbackData(BaseModel):
    feedback_id: Optional[str] = None
    customer_id: Optional[str] = None  # Contact number
    customer_name: Optional[str] = None
    room_id: str
    rating: Optional[int] = None  # 1-5 stars
    feedback_text: Optional[str] = None
    service_quality: Optional[int] = None
    agent_helpfulness: Optional[int] = None
    overall_experience: Optional[int] = None
    suggestions: Optional[str] = None
    feedback_date: Optional[datetime] = None

# New Admin Models
class AdminRegistration(BaseModel):
    name: str
    email: str
    password: str
    department: Optional[str] = None

class AdminLogin(BaseModel):
    employee_id: str
    password: str

class AdminData(BaseModel):
    admin_id: Optional[str] = None
    employee_id: Optional[str] = None  # Will be assigned after verification
    name: str
    email: str
    password_hash: str
    department: Optional[str] = None
    role: str = "admin"
    status: str = "pending_verification"  # Changed default to pending_verification
    email_verified: bool = False
    email_verification_token: Optional[str] = None
    email_verification_expires: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

class CreateFeedbackRequest(BaseModel):
    room_id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None
    service_quality: Optional[int] = Field(None, ge=1, le=5)
    agent_helpfulness: Optional[int] = Field(None, ge=1, le=5)
    overall_experience: Optional[int] = Field(None, ge=1, le=5)
    suggestions: Optional[str] = None

class SubmitOrderRequest(BaseModel):
    room_id: str
    order_data: Dict

class UpdateOrderStatusRequest(BaseModel):
    room_id: str
    order_id: str
    new_status: str
    admin_notes: Optional[str] = None


class RoomData(BaseModel):
    room_id: str
    transcripts: List[TranscriptItem]
    order: OrderData
    updated_at: float

# Utility functions for admin management
def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{password_hash}"

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        salt, hash_value = hashed_password.split(':')
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return password_hash == hash_value
    except ValueError:
        return False

def generate_verification_token() -> str:
    """Generate a secure verification token"""
    return secrets.token_urlsafe(32)

def send_admin_verification_email(admin_name: str, admin_email: str, verification_token: str):
    """Send verification email to admin and notification to meegadavamsi76@gmail.com"""
    try:
        # Check SMTP configuration
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            logging.warning("SMTP credentials not configured. Cannot send verification email.")
            return
            
        # Email configuration
        smtp_server = SMTP_SERVER
        smtp_port = SMTP_PORT
        sender_email = SMTP_USERNAME
        sender_password = SMTP_PASSWORD
        
        # Create verification URL (you'll need to implement the verification endpoint)
        verification_url = f"http://localhost:8000/api/auth/admin/verify-email?token={verification_token}"
        
        # Email to the admin
        admin_msg = MIMEMultipart()
        admin_msg['From'] = sender_email
        admin_msg['To'] = admin_email
        admin_msg['Subject'] = "Admin Account Verification Required"
        
        admin_body = f"""
        Dear {admin_name},
        
        Your admin account has been created and is pending verification.
        
        Please wait for approval from the system administrator.
        You will receive another email once your account is approved.
        
        Account Details:
        - Name: {admin_name}
        - Email: {admin_email}
        
        Best regards,
        AI Sales Assistant Team
        """
        
        admin_msg.attach(MIMEText(admin_body, 'plain'))
        
        # Email to meegadavamsi76@gmail.com for approval
        approval_msg = MIMEMultipart()
        approval_msg['From'] = sender_email
        approval_msg['To'] = "meegadavamsi76@gmail.com"
        approval_msg['Subject'] = f"New Admin Registration Approval Required - {admin_name}"
        
        approval_body = f"""
        A new admin account has been registered and requires your approval.
        
        Admin Details:
        - Name: {admin_name}
        - Email: {admin_email}
        - Registration Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        To approve this admin account, click the link below:
        {verification_url}
        
        If you did not expect this registration, please ignore this email.
        
        Best regards,
        AI Sales Assistant System
        """
        
        approval_msg.attach(MIMEText(approval_body, 'plain'))
        
        # Send emails
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            
            # Send to admin
            server.send_message(admin_msg)
            logging.info(f"Verification email sent to admin: {admin_email}")
            
            # Send to approver
            server.send_message(approval_msg)
            logging.info(f"Approval notification sent to: meegadavamsi76@gmail.com")
            
    except Exception as e:
        logging.error(f"Failed to send verification email: {e}")
        # For development, just log the verification URL
        logging.info(f"Verification URL (for development): {verification_url}")
        raise HTTPException(status_code=500, detail="Failed to send verification email")

def send_admin_approval_email(admin_name: str, admin_email: str, employee_id: str = None):
    """Send approval confirmation email to admin"""
    try:
        # Email configuration
        smtp_server = SMTP_SERVER
        smtp_port = SMTP_PORT
        sender_email = SMTP_USERNAME
        sender_password = SMTP_PASSWORD
        
        # Email to the admin confirming approval
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = admin_email
        msg['Subject'] = "Admin Account Approved - Welcome!"
        
        body = f"""
        Dear {admin_name},
        
        Great news! Your admin account has been approved and activated by meegadavamsi76@gmail.com.
        
        You can now log in to the AI Sales Assistant admin panel using your credentials.
        
        Account Details:
        - Name: {admin_name}
        - Email: {admin_email}
        - Employee ID: {employee_id or 'Not assigned'}
        - Status: Active
        
        Login Instructions:
        - Use your Employee ID: {employee_id}
        - Use the password you created during registration
        
        Welcome to the team!
        
        Best regards,
        AI Sales Assistant Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            logging.info(f"Approval confirmation email sent to: {admin_email}")
            
    except Exception as e:
        logging.error(f"Failed to send approval confirmation email: {e}")
        # Don't raise exception as this is not critical

def generate_employee_id() -> str:
    """Generate unique employee ID"""
    return f"EMP{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(3).upper()}"

def send_order_notification_email(order_data: OrderData, room_id: str):
    """Send order notification email to admin"""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            logging.warning("Email credentials not configured. Skipping email notification.")
            return False
            
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = ADMIN_EMAIL
        msg['Subject'] = f"New Book Order - {order_data.book_title or 'Unknown Book'}"
        
        # Email body
        body = f"""
        New Book Order Received!
        
        Order Details:
        - Order ID: {order_data.order_id or 'N/A'}
        - Customer ID: {order_data.customer_id or 'N/A'}
        - Customer Name: {order_data.customer_name or 'N/A'}
        - Book Title: {order_data.book_title or 'N/A'}
        - Author: {order_data.author or 'N/A'}
        - Genre: {order_data.genre or 'N/A'}
        - Quantity: {order_data.quantity or 'N/A'}
        - Unit Price: ${order_data.unit_price or 'N/A'}
        - Total Amount: ${order_data.total_amount or 'N/A'}
        - Payment Method: {order_data.payment_method or 'N/A'}
        - Delivery Option: {order_data.delivery_option or 'N/A'}
        - Delivery Address: {order_data.delivery_address or 'N/A'}
        - Special Requests: {order_data.special_requests or 'None'}
        - Order Date: {order_data.order_date or datetime.utcnow()}
        - Room ID: {room_id}
        
        Please process this order promptly.
        
        Best regards,
        BookWise AI Assistant
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USERNAME, ADMIN_EMAIL, text)
        server.quit()
        
        logging.info(f"Order notification email sent for order {order_data.order_id}")
        return True
        
    except Exception as e:
        logging.error(f"Failed to send order notification email: {e}")
        return False


def extract_order_data(transcripts: List[TranscriptItem]) -> OrderData:
    # Enhanced extraction from both user and agent messages
    # Processes both user inputs and agent responses for comprehensive data capture
    import re

    # Separate user and agent messages for better context
    user_messages = [t.message for t in transcripts if t.role == "user"]
    agent_messages = [t.message for t in transcripts if t.role == "assistant"]
    
    # Combine all messages for comprehensive extraction
    full_text = "\n".join([t.message for t in transcripts])
    user_text = "\n".join(user_messages)
    agent_text = "\n".join(agent_messages)

    # Enhanced name extraction from both user and agent messages
    name_patterns = [
        r"(?i)(?:customer\s*name\s*[:\-]\s*|my\s+name\s+is\s+|i\s+am\s+|this\s+is\s+|call\s+me\s+)([a-zA-Z][a-zA-Z\s']{2,40})",
        r"(?i)(?:hello\s+|hi\s+|good\s+(?:morning|afternoon|evening)\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?",  # Greetings with names
        r"(?i)(?:speaking\s+with\s+|talking\s+to\s+)([a-zA-Z][a-zA-Z\s']{2,40})",  # Agent identifying customer
    ]
    
    name_match = None
    for pattern in name_patterns:
        name_match = re.search(pattern, full_text)
        if name_match:
            break

    # Customer ID / Contact number (simple digit sequence 6-15 length)
    customer_id_match = re.search(r"(?i)(?:id\s*[:\-]?\s*|contact(?:\s*number)?\s*[:\-]?\s*|phone(?:\s*number)?\s*[:\-]?\s*|mobile(?:\s*number)?\s*[:\-]?\s*)([\d\-\s]{6,20})", full_text)

    # Enhanced book title extraction with multiple patterns
    title_patterns = [
        r"[""''\"]([^""''\"][^\n]{1,80})[""''\"]",  # Quoted titles
        r"(?i)(?:book\s*(?:is|title|called)\s*[:\-]?\s*)([a-zA-Z][^\n]{1,80}?)(?:\s*by\s|\s*author|\.|,|$)",  # "book is/title/called"
        r"(?i)(?:looking\s+for\s+|want\s+(?:the\s+)?book\s+|interested\s+in\s+)([a-zA-Z][^\n]{1,80}?)(?:\s*by\s|\s*author|\.|,|$)",  # "looking for/want book"
        r"(?i)(?:recommend\s+|suggest\s+)([a-zA-Z][^\n]{1,80}?)(?:\s*by\s|\s*author|\.|,|$)",  # Agent recommendations
        r"(?i)(?:have\s+you\s+read\s+|what\s+about\s+)([a-zA-Z][^\n]{1,80}?)(?:\s*by\s|\s*author|\.|,|\?|$)",  # Agent suggestions
    ]
    
    title_match = None
    for pattern in title_patterns:
        title_match = re.search(pattern, full_text)
        if title_match:
            break
    
    # Enhanced author extraction
    author_patterns = [
        r"(?i)(?:author\s*[:\-]?\s*|by\s+|written\s*by\s*)([a-zA-Z][a-zA-Z\s']{2,40})",
        r"(?i)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'s\s+(?:book|novel|work)",  # "Author's book"
        r"(?i)(?:from\s+author\s+)([a-zA-Z][a-zA-Z\s']{2,40})",  # "from author"
    ]
    
    author_match = None
    for pattern in author_patterns:
        author_match = re.search(pattern, full_text)
        if author_match:
            break
    
    # Genre extraction
    genre_match = re.search(r"(?i)(?:genre\s*[:\-]?\s*|category\s*[:\-]?\s*)(fiction|non-fiction|mystery|romance|thriller|sci-fi|fantasy|biography|history|self-help|business|children|young-adult)", full_text)

    # Enhanced quantity extraction
    qty_patterns = [
        r"(?i)(?:quantity\s*[:\-]?\s*|need\s+|want\s+|order\s+)(\b\d{1,3}\b)\s*(?:copies?|units?|books?|pieces?)",
        r"(?i)(\b\d{1,3}\b)\s*(?:copies?|units?|books?|pieces?)\s*(?:of|please)",
        r"(?i)(?:buy|purchase|get)\s+(\b\d{1,3}\b)\s*(?:copies?|units?|books?)",
        r"(?i)(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:copies?|books?)",  # Word numbers
    ]
    
    qty_match = None
    for pattern in qty_patterns:
        qty_match = re.search(pattern, full_text)
        if qty_match:
            break
    
    # Convert word numbers to digits
    word_to_num = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
    }
    
    if not qty_match:
        # Try word-based quantity
        word_qty_match = re.search(r"(?i)\b(one|two|three|four|five|six|seven|eight|nine|ten)\b\s*(?:copies?|books?)", full_text)
        if word_qty_match:
            qty_match = type('obj', (object,), {'group': lambda x: word_to_num.get(word_qty_match.group(1).lower(), '1')})()

    # Enhanced payment method extraction
    pay_patterns = [
        r"(?i)(?:payment\s*(?:method|option)?\s*[:\-]?\s*|pay\s*(?:by|with|using)\s*|paying\s*(?:by|with)\s*)(online|card|credit\s*card|debit\s*card|cash(?:\s*on\s*delivery)?|cod|upi|netbanking|paypal|gpay|phonepe|paytm)",
        r"(?i)\b(credit\s*card|debit\s*card|cash|upi|netbanking|paypal|gpay|phonepe|paytm|cod)\b",
        r"(?i)(?:accept\s+|take\s+)(credit\s*card|debit\s*card|cash|upi|digital\s*payment)",
    ]
    
    pay_match = None
    for pattern in pay_patterns:
        pay_match = re.search(pattern, full_text)
        if pay_match:
            break

    # Enhanced delivery option and address extraction
    delivery_option = None
    delivery_address = None
    
    delivery_patterns = {
        "store_pickup": [r"(?i)pickup|pick\s*up|store\s*pickup|collect|come\s*and\s*get"],
        "home_delivery": [r"(?i)home\s*delivery|deliver\s*to\s*home|home\s*address|ship\s*to\s*home"],
        "express_delivery": [r"(?i)express|fast|urgent|quick\s*delivery|same\s*day"]
    }
    
    for option, patterns in delivery_patterns.items():
        for pattern in patterns:
            if re.search(pattern, full_text):
                delivery_option = option
                break
        if delivery_option:
            break
    
    # Default to home delivery if not specified
    if not delivery_option:
        delivery_option = "home_delivery"
    
    # Try to extract address for home delivery
    if delivery_option == "home_delivery":
        address_patterns = [
            r"(?i)(?:address\s*[:\-]?\s*|deliver\s*to\s*|ship\s*to\s*|my\s*address\s*is\s*)([^\n]{10,120})",
            r"(?i)(?:live\s*(?:at|in)\s*|staying\s*(?:at|in)\s*)([^\n]{10,120})",
        ]
        
        for pattern in address_patterns:
            address_match = re.search(pattern, full_text)
            if address_match:
                delivery_address = address_match.group(1).strip()
                break
    
    # Enhanced special requests extraction
    special_patterns = [
        r"(?i)(?:special\s*request\s*[:\-]?\s*|note\s*[:\-]?\s*|instruction\s*[:\-]?\s*|please\s*note\s*[:\-]?\s*)([^\n]{5,200})",
        r"(?i)(?:also\s*|additionally\s*|by\s*the\s*way\s*|oh\s*and\s*)([^\n]{5,200})",
        r"(?i)(?:make\s*sure\s*|ensure\s*|remember\s*to\s*)([^\n]{5,200})",
    ]
    
    special_requests_match = None
    for pattern in special_patterns:
        special_requests_match = re.search(pattern, full_text)
        if special_requests_match:
            break

    quantity_val: Optional[int] = None
    if qty_match:
        try:
            quantity_val = int(qty_match.group(1))
        except Exception:
            quantity_val = None
    
    # Extract book title from either quoted text or "book is" pattern
    book_title = None
    if title_match:
        book_title = (title_match.group(1) or title_match.group(2) or "").strip()
    
    # Generate order ID if we have enough data
    order_id = None
    if book_title and customer_id_match:
        import uuid
        order_id = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Calculate total amount (placeholder logic - you can update with actual pricing)
    unit_price = 15.99  # Default book price
    total_amount = None
    if quantity_val and unit_price:
        total_amount = quantity_val * unit_price

    return OrderData(
        order_id=order_id,
        customer_id=(customer_id_match.group(1).strip() if customer_id_match else None),
        customer_name=(name_match.group(1).strip() if name_match else None),
        book_title=book_title,
        author=(author_match.group(1).strip() if author_match else None),
        genre=(genre_match.group(1).lower() if genre_match else None),
        quantity=quantity_val,
        unit_price=unit_price,
        total_amount=total_amount,
        payment_method=(pay_match.group(1).lower() if pay_match else None),
        delivery_option=delivery_option,
        delivery_address=delivery_address,
        order_status="pending",
        order_date=datetime.utcnow(),
        special_requests=(special_requests_match.group(1).strip() if special_requests_match else None),
    )


app = FastAPI(title="Book Voice Assistant Backend", version="0.1.0")

# CORS (allow frontend during dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/token", response_model=Dict[str, str])
async def get_livekit_token(req: TokenRequest):
    try:
        if not LIVEKIT_AVAILABLE:
            raise HTTPException(status_code=503, detail="LiveKit API not available. Please install livekit-api package.")
            
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET or LIVEKIT_API_KEY == "YOUR_LIVEKIT_API_KEY" or LIVEKIT_API_SECRET == "YOUR_LIVEKIT_API_SECRET":
            raise HTTPException(status_code=500, detail="LiveKit API key or secret not set")

        token = AccessToken(
            LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET,
        )
        token.with_identity(req.identity).with_grants(
            VideoGrants(room_join=True, room=req.room_name)
        )

        return {"access_token": token.to_jwt()}
    except Exception as e:
        logging.error(f"Error generating LiveKit token: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    await db_service.connect()

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await db_service.disconnect()

@app.post("/process-transcription", response_model=RoomData)
async def process_transcription(req: ProcessTranscriptionRequest):
    try:
        # Store transcript in MongoDB
        transcript_data = {
            "id": req.item.id,
            "role": req.item.role,
            "message": req.item.message,
            "timestamp": req.item.timestamp,
            "created_at": datetime.utcnow().timestamp()
        }
        await db_service.store_transcript(req.room_id, transcript_data)
        
        # Get all transcripts for this room
        transcripts = await db_service.get_transcripts(req.room_id)
        
        # Convert to TranscriptItem objects
        transcript_items = [
            TranscriptItem(
                id=t["id"],
                role=t["role"],
                message=t["message"],
                timestamp=t["timestamp"]
            ) for t in transcripts
        ]
        
        # Extract order data from all transcripts
        order_data = extract_order_data(transcript_items)
        
        # Store order data in MongoDB
        order_dict = order_data.dict()
        await db_service.store_order(req.room_id, order_dict)
        
        # Send email notification if order has sufficient data
        if order_data.order_id and order_data.customer_id and order_data.book_title:
            send_order_notification_email(order_data, req.room_id)
        
        # Return room data
        room_data = RoomData(
            room_id=req.room_id,
            transcripts=transcript_items,
            order=order_data,
            updated_at=datetime.utcnow().timestamp(),
        )
        return room_data
        
    except Exception as e:
        logging.error(f"Error processing transcription: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/rooms/{room_id}", response_model=RoomData)
async def get_room(room_id: str):
    try:
        # Get transcripts from MongoDB
        transcripts = await db_service.get_transcripts(room_id)
        if not transcripts:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Convert to TranscriptItem objects
        transcript_items = [
            TranscriptItem(
                id=t["id"],
                role=t["role"],
                message=t["message"],
                timestamp=t["timestamp"]
            ) for t in transcripts
        ]
        
        # Get order data from MongoDB
        order_doc = await db_service.get_order(room_id)
        order_data = OrderData()
        if order_doc:
            order_data = OrderData(
                order_id=order_doc.get("order_id"),
                customer_id=order_doc.get("customer_id"),
                customer_name=order_doc.get("customer_name"),
                book_title=order_doc.get("book_title"),
                author=order_doc.get("author"),
                genre=order_doc.get("genre"),
                quantity=order_doc.get("quantity"),
                unit_price=order_doc.get("unit_price"),
                total_amount=order_doc.get("total_amount"),
                payment_method=order_doc.get("payment_method"),
                delivery_option=order_doc.get("delivery_option"),
                delivery_address=order_doc.get("delivery_address"),
                order_status=order_doc.get("order_status", "pending"),
                order_date=order_doc.get("order_date"),
                special_requests=order_doc.get("special_requests"),
            )
        
        room_data = RoomData(
            room_id=room_id,
            transcripts=transcript_items,
            order=order_data,
            updated_at=datetime.utcnow().timestamp(),
        )
        return room_data
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting room data: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "services": {
            "database": "mongodb" if not db_service.use_memory else "memory",
            "livekit": "available" if LIVEKIT_AVAILABLE else "unavailable",
            "email": "configured" if SMTP_USERNAME and SMTP_PASSWORD else "not_configured"
        },
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# Simple authentication endpoints for development
@app.get("/api/auth/me")
def get_current_user():
    """Enhanced auth endpoint with session support"""
    # In a real app, you'd check the session/token here
    # For development, we'll return a default user
    return {
        "user": {
            "id": "dev_user_001",
            "name": "Development User",
            "email": "dev@bookwise.com",
            "role": "user"
        }
    }

@app.post("/api/auth/login")
async def login(credentials: dict):
    """Enhanced login endpoint with database-based admin authentication"""
    email = credentials.get("email", "")
    password = credentials.get("password", "")
    employee_id = credentials.get("employee_id", "")
    user_type = credentials.get("userType", "customer")
    
    # Admin authentication
    if user_type == "admin":
        if not employee_id or not password:
            raise HTTPException(status_code=400, detail="Employee ID and password required for admin login")
        
        # Get admin from database
        admin = await db_service.get_admin_by_employee_id(employee_id)
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        # Verify password
        if not verify_password(password, admin["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        # Check email verification status
        if not admin.get("email_verified", False):
            raise HTTPException(status_code=403, detail="Admin account is not verified. Please wait for administrator approval.")
        
        # Check account status
        if admin.get("status") != "active":
            raise HTTPException(status_code=403, detail="Admin account is not active. Please contact administrator.")
        
        # Update last login
        await db_service.update_admin_last_login(employee_id, datetime.now().isoformat())
        
        return {
            "user": {
                "id": admin["admin_id"] or str(admin.get("_id")),
                "name": admin["name"],
                "email": admin["email"],
                "employee_id": admin["employee_id"],
                "role": "admin",
                "department": admin.get("department")
            },
            "token": f"admin_token_{secrets.token_hex(16)}"
        }
    
    # Customer authentication (simplified for development)
    return {
        "user": {
            "id": "dev_user_001",
            "name": "Development User",
            "email": email or "dev@bookwise.com",
            "role": "user"
        },
        "token": "dev_token_123"
    }

@app.post("/api/auth/logout")
def logout():
    """Simple logout endpoint"""
    return {"message": "Logged out successfully"}

# Admin Registration and Management Endpoints
@app.post("/api/auth/admin/register")
async def register_admin(admin_data: AdminRegistration):
    """Register a new admin account"""
    try:
        # Check if email already exists
        existing_email = await db_service.get_admin_by_email(admin_data.email)
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Generate verification token
        verification_token = generate_verification_token()
        verification_expires = datetime.now() + timedelta(days=7)  # Token expires in 7 days
        
        # Create admin data with verification fields (no employee_id yet)
        admin_record = {
            "admin_id": str(uuid.uuid4()),
            "employee_id": None,  # Will be assigned after verification
            "name": admin_data.name,
            "email": admin_data.email,
            "password_hash": hash_password(admin_data.password),
            "department": admin_data.department,
            "role": "admin",
            "status": "pending_verification",
            "email_verified": False,
            "email_verification_token": verification_token,
            "email_verification_expires": verification_expires.isoformat(),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "last_login": None
        }
        
        # Store in database
        admin_id = await db_service.create_admin(admin_record)
        
        # Send verification email (non-blocking)
        try:
            # Check if SMTP is configured before attempting to send
            if SMTP_USERNAME and SMTP_PASSWORD:
                send_admin_verification_email(admin_data.name, admin_data.email, verification_token)
            else:
                logging.warning("SMTP not configured. Verification email not sent.")
                logging.info(f"Verification URL for development: http://localhost:8000/api/auth/admin/verify-email?token={verification_token}")
        except Exception as e:
            logging.warning(f"Failed to send verification email, but admin account created: {e}")
            logging.info(f"Verification URL for development: http://localhost:8000/api/auth/admin/verify-email?token={verification_token}")
        
        # Determine message based on email configuration
        email_status = "Verification email sent to administrator." if (SMTP_USERNAME and SMTP_PASSWORD) else "Email configuration not set up - manual verification required."
        
        return {
            "message": f"Admin account created successfully. {email_status} Employee ID will be assigned after approval.",
            "admin_id": admin_id,
            "name": admin_data.name,
            "email": admin_data.email,
            "status": "pending_verification",
            "note": "Employee ID will be assigned by meegadavamsi76@gmail.com after verification",
            "verification_token": verification_token if not (SMTP_USERNAME and SMTP_PASSWORD) else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating admin account: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create admin account: {str(e)}")

@app.get("/api/auth/admin/verify-email")
async def verify_admin_email(token: str):
    """Verify admin email using verification token"""
    try:
        if not token:
            raise HTTPException(status_code=400, detail="Verification token is required")
        
        # Get admin by verification token
        admin = await db_service.get_admin_by_verification_token(token)
        if not admin:
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        
        # Check if token is expired
        if admin.get("email_verification_expires"):
            expires_at = datetime.fromisoformat(admin["email_verification_expires"])
            if datetime.now() > expires_at:
                raise HTTPException(status_code=400, detail="Verification token has expired")
        
        # Generate employee ID
        employee_id = generate_employee_id()
        
        # Update admin verification status and assign employee_id
        updated_admin = await db_service.update_admin_verification(token, email_verified=True, status="active", employee_id=employee_id)
        if not updated_admin:
            raise HTTPException(status_code=500, detail="Failed to update admin verification status")
        
        # Send confirmation email to the admin
        try:
            send_admin_approval_email(updated_admin["name"], updated_admin["email"], updated_admin["employee_id"])
        except Exception as e:
            logging.warning(f"Failed to send approval confirmation email: {e}")
        
        return {
            "message": "Admin account verified and activated successfully",
            "admin_name": updated_admin["name"],
            "admin_email": updated_admin["email"],
            "employee_id": updated_admin["employee_id"],
            "status": "active"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error verifying admin email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to verify admin email: {str(e)}")

@app.get("/api/admin/list")
async def get_all_admins():
    """Get all admin accounts (admin only)"""
    try:
        admins = await db_service.get_all_admins()
        
        # Remove sensitive data from response
        safe_admins = []
        for admin in admins:
            safe_admin = {
                "admin_id": admin.get("admin_id") or str(admin.get("_id")),
                "employee_id": admin["employee_id"],
                "name": admin["name"],
                "email": admin["email"],
                "department": admin.get("department"),
                "status": admin.get("status", "active"),
                "created_at": admin.get("created_at"),
                "last_login": admin.get("last_login")
            }
            safe_admins.append(safe_admin)
        
        return {
            "total_admins": len(safe_admins),
            "admins": safe_admins
        }
        
    except Exception as e:
        logging.error(f"Error getting admin list: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get admin list: {str(e)}")

@app.get("/api/admin/export-admins")
async def export_admins_excel():
    """Export admin data to Excel"""
    try:
        admins = await db_service.get_all_admins()
        
        # Prepare data for Excel
        admin_data = []
        for admin in admins:
            admin_data.append({
                "Employee ID": admin["employee_id"],
                "Name": admin["name"],
                "Email": admin["email"],
                "Department": admin.get("department", "N/A"),
                "Status": admin.get("status", "active"),
                "Created Date": admin.get("created_at", "N/A"),
                "Last Login": admin.get("last_login", "Never")
            })
        
        # Create Excel file
        df = pd.DataFrame(admin_data)
        excel_buffer = BytesIO()
        
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Admin Accounts', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['Admin Accounts']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        excel_buffer.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"admin_accounts_{timestamp}.xlsx"
        
        return StreamingResponse(
            BytesIO(excel_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logging.error(f"Error exporting admin data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export admin data: {str(e)}")

@app.get("/api/admin/export-orders")
async def export_orders_excel():
    """Export order data to Excel"""
    try:
        orders = await db_service.get_all_orders()
        
        # Prepare data for Excel
        order_data = []
        for order in orders:
            order_data.append({
                "Order ID": order.get("order_id", "N/A"),
                "Customer ID": order.get("customer_id", "N/A"),
                "Customer Name": order.get("customer_name", "N/A"),
                "Book Title": order.get("book_title", "N/A"),
                "Author": order.get("author", "N/A"),
                "Genre": order.get("genre", "N/A"),
                "Quantity": order.get("quantity", 0),
                "Unit Price": order.get("unit_price", 0),
                "Total Amount": order.get("total_amount", 0),
                "Payment Method": order.get("payment_method", "N/A"),
                "Delivery Option": order.get("delivery_option", "N/A"),
                "Delivery Address": order.get("delivery_address", "N/A"),
                "Order Status": order.get("order_status", "pending"),
                "Order Date": order.get("order_date", "N/A"),
                "Special Requests": order.get("special_requests", "None"),
                "Room ID": order.get("room_id", "N/A")
            })
        
        # Create Excel file
        df = pd.DataFrame(order_data)
        excel_buffer = BytesIO()
        
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Orders', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['Orders']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        excel_buffer.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"orders_{timestamp}.xlsx"
        
        return StreamingResponse(
            BytesIO(excel_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logging.error(f"Error exporting order data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export order data: {str(e)}")

@app.get("/transcripts/all")
async def get_all_transcripts():
    """Get all stored transcripts across all rooms"""
    try:
        all_transcripts = {}
        
        if db_service.use_memory:
            # Get from memory storage
            for room_id, transcripts in db_service._memory_transcripts.items():
                all_transcripts[room_id] = [
                    TranscriptItem(
                        id=t["id"],
                        role=t["role"],
                        message=t["message"],
                        timestamp=t["timestamp"]
                    ) for t in transcripts
                ]
        else:
            # Get from MongoDB
            cursor = db_service.transcripts_collection.find({}).sort("timestamp", 1)
            transcripts = await cursor.to_list(length=None)
            
            # Group by room_id
            from collections import defaultdict
            grouped = defaultdict(list)
            for t in transcripts:
                grouped[t["room_id"]].append(
                    TranscriptItem(
                        id=t["id"],
                        role=t["role"],
                        message=t["message"],
                        timestamp=t["timestamp"]
                    )
                )
            all_transcripts = dict(grouped)
        
        return {
            "total_rooms": len(all_transcripts),
            "total_transcripts": sum(len(transcripts) for transcripts in all_transcripts.values()),
            "rooms": all_transcripts
        }
        
    except Exception as e:
        logging.error(f"Error getting all transcripts: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/orders/all")
async def get_all_orders():
    """Get all stored orders across all rooms"""
    try:
        all_orders = {}
        
        if db_service.use_memory:
            # Get from memory storage
            for room_id, order_data in db_service._memory_orders.items():
                all_orders[room_id] = OrderData(
                    order_id=order_data.get("order_id"),
                    customer_id=order_data.get("customer_id"),
                    customer_name=order_data.get("customer_name"),
                    book_title=order_data.get("book_title"),
                    author=order_data.get("author"),
                    genre=order_data.get("genre"),
                    quantity=order_data.get("quantity"),
                    unit_price=order_data.get("unit_price"),
                    total_amount=order_data.get("total_amount"),
                    payment_method=order_data.get("payment_method"),
                    delivery_option=order_data.get("delivery_option"),
                    delivery_address=order_data.get("delivery_address"),
                    order_status=order_data.get("order_status", "pending"),
                    order_date=order_data.get("order_date"),
                    special_requests=order_data.get("special_requests"),
                )
        else:
            # Get from MongoDB
            cursor = db_service.orders_collection.find({})
            orders = await cursor.to_list(length=None)
            
            for order in orders:
                all_orders[order["room_id"]] = OrderData(
                    order_id=order.get("order_id"),
                    customer_id=order.get("customer_id"),
                    customer_name=order.get("customer_name"),
                    book_title=order.get("book_title"),
                    author=order.get("author"),
                    genre=order.get("genre"),
                    quantity=order.get("quantity"),
                    unit_price=order.get("unit_price"),
                    total_amount=order.get("total_amount"),
                    payment_method=order.get("payment_method"),
                    delivery_option=order.get("delivery_option"),
                    delivery_address=order.get("delivery_address"),
                    order_status=order.get("order_status", "pending"),
                    order_date=order.get("order_date"),
                    special_requests=order.get("special_requests"),
                )
        
        return {
            "total_orders": len(all_orders),
            "orders": all_orders
        }
        
    except Exception as e:
        logging.error(f"Error getting all orders: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/feedback", response_model=FeedbackData)
async def create_feedback(req: CreateFeedbackRequest):
    """Create new feedback entry"""
    try:
        import uuid
        
        # Generate feedback ID
        feedback_id = f"FB-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create feedback data
        feedback_data = FeedbackData(
            feedback_id=feedback_id,
            customer_id=req.customer_id,
            customer_name=req.customer_name,
            room_id=req.room_id,
            rating=req.rating,
            feedback_text=req.feedback_text,
            service_quality=req.service_quality,
            agent_helpfulness=req.agent_helpfulness,
            overall_experience=req.overall_experience,
            suggestions=req.suggestions,
            feedback_date=datetime.utcnow()
        )
        
        # Store feedback in database
        feedback_dict = feedback_data.dict()
        await db_service.store_feedback(feedback_dict)
        
        logging.info(f"Feedback created: {feedback_id}")
        return feedback_data
        
    except Exception as e:
        logging.error(f"Error creating feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/feedback/all")
async def get_all_feedback():
    """Get all stored feedback"""
    try:
        all_feedback = await db_service.get_all_feedback()
        
        return {
            "total_feedback": len(all_feedback),
            "feedback": all_feedback
        }
        
    except Exception as e:
        logging.error(f"Error getting all feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/feedback/room/{room_id}")
async def get_room_feedback(room_id: str):
    """Get feedback for a specific room"""
    try:
        feedback = await db_service.get_feedback_by_room(room_id)
        
        if not feedback:
            raise HTTPException(status_code=404, detail="No feedback found for this room")
        
        return feedback
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting room feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/orders/submit")
async def submit_order(req: SubmitOrderRequest):
    """Submit and confirm an order"""
    try:
        import uuid
        
        # Generate order ID if not present
        order_data = req.order_data.copy()
        if not order_data.get('order_id'):
            order_data['order_id'] = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Set order status and date
        order_data['order_status'] = 'confirmed'
        order_data['order_date'] = datetime.utcnow()
        
        # Calculate total if not present
        if not order_data.get('total_amount') and order_data.get('quantity'):
            unit_price = order_data.get('unit_price', 15.99)
            order_data['total_amount'] = float(order_data['quantity']) * unit_price
            order_data['unit_price'] = unit_price
        
        # Store confirmed order in database
        await db_service.store_order(req.room_id, order_data)
        
        # Send email notification
        order_obj = OrderData(**order_data)
        send_order_notification_email(order_obj, req.room_id)
        
        logging.info(f"Order submitted successfully: {order_data['order_id']}")
        
        return {
            "success": True,
            "order_id": order_data['order_id'],
            "message": "Order submitted successfully",
            "order_data": order_data
        }
        
    except Exception as e:
        logging.error(f"Error submitting order: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit order: {str(e)}")

@app.get("/orders-dashboard")
async def get_orders_dashboard():
    """Serve the orders dashboard HTML page"""
    try:
        import os
        dashboard_path = os.path.join(os.path.dirname(__file__), "orders-dashboard.html")
        if os.path.exists(dashboard_path):
            return FileResponse(dashboard_path, media_type="text/html")
        else:
            raise HTTPException(status_code=404, detail="Orders dashboard not found")
    except Exception as e:
        logging.error(f"Error serving orders dashboard: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/admin-dashboard")
async def get_admin_dashboard():
    """Serve the admin dashboard HTML page"""
    try:
        import os
        dashboard_path = os.path.join(os.path.dirname(__file__), "enhanced-admin-dashboard.html")
        if os.path.exists(dashboard_path):
            return FileResponse(dashboard_path, media_type="text/html")
        else:
            raise HTTPException(status_code=404, detail="Admin dashboard not found")
    except Exception as e:
        logging.error(f"Error serving admin dashboard: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/export/data")
async def export_all_data():
    """Export all data for backup purposes"""
    try:
        all_feedback = await db_service.get_all_feedback()
        
        export_data = {
            "export_timestamp": datetime.utcnow().isoformat(),
            "transcripts": dict(db_service._memory_transcripts) if db_service.use_memory else "stored_in_mongodb",
            "orders": dict(db_service._memory_orders) if db_service.use_memory else "stored_in_mongodb",
            "feedback": all_feedback,
            "metadata": {
                "storage_type": "memory" if db_service.use_memory else "mongodb",
                "total_rooms": len(db_service._memory_transcripts) if db_service.use_memory else "unknown",
                "total_transcripts": sum(len(v) for v in db_service._memory_transcripts.values()) if db_service.use_memory else "unknown",
                "total_orders": len(db_service._memory_orders) if db_service.use_memory else "unknown",
                "total_feedback": len(all_feedback)
            }
        }
        
        return export_data
        
    except Exception as e:
        logging.error(f"Error exporting data: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")