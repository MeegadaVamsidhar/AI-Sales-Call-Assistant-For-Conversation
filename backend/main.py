from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
from db.database import db_service
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

# Optional imports - make them fail gracefully
try:
    from services.sentiment_analysis import sentiment_engine
    SENTIMENT_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Sentiment analysis not available: {e}")
    SENTIMENT_AVAILABLE = False
    sentiment_engine = None

try:
    from services.product_recommendation import recommendation_engine
    RECOMMENDATION_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Product recommendation not available: {e}")
    RECOMMENDATION_AVAILABLE = False
    recommendation_engine = None

try:
    from services.question_generator import question_generator
    QUESTION_GENERATOR_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Question generator not available: {e}")
    QUESTION_GENERATOR_AVAILABLE = False
    question_generator = None

try:
    from core.call_summary_generator import summary_generator
    CALL_SUMMARY_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Call summary generator not available: {e}")
    CALL_SUMMARY_AVAILABLE = False
    summary_generator = None

try:
    from core.call_end_handler import generate_call_end_report
    CALL_END_HANDLER_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Call end handler not available: {e}")
    CALL_END_HANDLER_AVAILABLE = False
    generate_call_end_report = None

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
# Force reload trigger

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
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")

class TokenRequest(BaseModel):
    room_name: str
    identity: str
    userName: Optional[str] = None



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


class SentimentData(BaseModel):
    overall_sentiment: str
    confidence: float
    polarity: float
    subjectivity: float
    intensity: float
    emotions: Dict[str, float]
    urgency: float
    engagement: float
    satisfaction: float
    purchase_intent: float
    objection_level: float
    trust_level: float
    timestamp: datetime
    message_length: int
    processing_time: float

class SentimentShiftData(BaseModel):
    previous_sentiment: str
    current_sentiment: str
    shift_magnitude: float
    shift_direction: str
    trigger_phrases: List[str]
    timestamp: datetime
    confidence: float

class RoomData(BaseModel):
    room_id: str
    transcripts: List[TranscriptItem]
    order: OrderData
    sentiment_analysis: Optional[Dict[str, Any]] = None
    sentiment_shifts: Optional[List[SentimentShiftData]] = None
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
    """Send verification email to admin and notification to system administrator"""
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
        
        # Email to system administrator for approval
        approval_msg = MIMEMultipart()
        approval_msg['From'] = sender_email
        approval_msg['To'] = ADMIN_EMAIL
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
            logging.info(f"Approval notification sent to: {ADMIN_EMAIL}")
            
    except Exception as e:
        logging.error(f"Failed to send verification email: {e}")
        # For development, just log the verification URL
        logging.info(f"Verification URL (for development): {verification_url}")
        raise HTTPException(status_code=500, detail="Failed to send verification email")

def send_admin_approval_email(admin_name: str, admin_email: str, employee_id: Optional[str] = None):
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
        
        Great news! Your admin account has been approved and activated by the system administrator.
        
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

    # Separate user and agent messages for better context (keeping for future use)
    # user_messages = [t.message for t in transcripts if t.role == "user"]
    # agent_messages = [t.message for t in transcripts if t.role == "assistant"]
    
    # Combine all messages for comprehensive extraction
    full_text = "\n".join([t.message for t in transcripts])

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
            # Create a mock match object for word-based quantities
            class MockMatch:
                def group(self, n: int) -> str:
                    return word_to_num.get(word_qty_match.group(1).lower(), '1')
            qty_match = MockMatch()

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
    
    # Don't generate order ID during extraction - only when user confirms
    order_id = None
    
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
        order_status="draft",  # Changed to 'draft' - not confirmed yet
        order_date=None,  # Don't set date until user confirms
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

        if AccessToken is None or VideoGrants is None:
            raise HTTPException(status_code=503, detail="LiveKit API not available. Please install livekit-api package.")
            
        token = AccessToken(
            LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET,
        )
        token.with_identity(req.identity).with_grants(
            VideoGrants(room_join=True, room=req.room_name)
        )
        
        # Add userName to token metadata if provided
        if req.userName:
            token.with_metadata(json.dumps({"userName": req.userName}))

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
        
        # Real-time sentiment analysis for user messages
        sentiment_analysis = None
        sentiment_shifts = []
        
        if req.item.role == "user" and req.item.message.strip() and SENTIMENT_AVAILABLE:
            try:
                # Analyze sentiment of the user message
                sentiment_score = await sentiment_engine.analyze_message_sentiment(
                    req.item.message, 
                    user_id=req.room_id
                )
                
                # Convert to dictionary for API response
                sentiment_analysis = {
                    "overall_sentiment": sentiment_score.overall_sentiment.value,
                    "confidence": sentiment_score.confidence,
                    "polarity": sentiment_score.polarity,
                    "subjectivity": sentiment_score.subjectivity,
                    "intensity": sentiment_score.intensity,
                    "emotions": sentiment_score.emotions,
                    "urgency": sentiment_score.urgency,
                    "engagement": sentiment_score.engagement,
                    "satisfaction": sentiment_score.satisfaction,
                    "purchase_intent": sentiment_score.purchase_intent,
                    "objection_level": sentiment_score.objection_level,
                    "trust_level": sentiment_score.trust_level,
                    "timestamp": sentiment_score.timestamp.isoformat(),
                    "message_length": sentiment_score.message_length,
                    "processing_time": sentiment_score.processing_time
                }
                
                # Detect sentiment shifts
                shifts = sentiment_engine.detect_sentiment_shifts(req.room_id)
                sentiment_shifts = [
                    SentimentShiftData(
                        previous_sentiment=shift.previous_sentiment.value,
                        current_sentiment=shift.current_sentiment.value,
                        shift_magnitude=shift.shift_magnitude,
                        shift_direction=shift.shift_direction,
                        trigger_phrases=shift.trigger_phrases,
                        timestamp=shift.timestamp,
                        confidence=shift.confidence
                    ) for shift in shifts
                ]
                
                # Store sentiment data in MongoDB
                await db_service.store_sentiment_data(req.room_id, sentiment_analysis)
                
                logging.info(f"Sentiment analysis completed for room {req.room_id}: {sentiment_score.overall_sentiment.value} (confidence: {sentiment_score.confidence:.2f})")
                
            except Exception as e:
                logging.error(f"Sentiment analysis failed: {e}")
                # Continue processing even if sentiment analysis fails
        
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
        
        # Extract order data from all transcripts (for display only)
        order_data = extract_order_data(transcript_items)
        
        # Don't automatically store orders - only store when user confirms via /orders/submit
        # This prevents creating orders just from conversation without confirmation
        
        # Return room data with sentiment analysis
        room_data = RoomData(
            room_id=req.room_id,
            transcripts=transcript_items,
            order=order_data,
            sentiment_analysis=sentiment_analysis,
            sentiment_shifts=sentiment_shifts,
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
    name = credentials.get("name", "")
    user_type = credentials.get("userType", "customer")
    is_oauth = credentials.get("isOAuth", False)  # Flag to indicate OAuth login
    
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
    # For OAuth login, allow without name but agent will ask for it
    # For regular login, require name upfront
    if not is_oauth and not name:
        raise HTTPException(status_code=400, detail="Name is required for customer login")
    
    return {
        "user": {
            "id": "dev_user_001",
            "name": name if name else None,  # None if OAuth without name
            "email": email or "dev@bookwise.com",
            "role": "user"
        },
        "token": "dev_token_123",
        "needsName": is_oauth and not name  # Signal frontend that agent should ask for name
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
        
        # Use openpyxl directly to avoid BytesIO compatibility issues
        from openpyxl import Workbook
        from openpyxl.utils.dataframe import dataframe_to_rows
        
        wb = Workbook()
        ws = wb.active
        if ws is not None:
            ws.title = 'Admin Accounts'
            
            # Add data from DataFrame
            for r in dataframe_to_rows(df, index=False, header=True):
                ws.append(r)
            
            # Auto-adjust column widths
            for column in ws.columns:
                max_length = 0
                try:
                    first_cell = column[0]
                    if hasattr(first_cell, 'column_letter'):
                        column_letter = getattr(first_cell, 'column_letter', None)
                        if column_letter is None:
                            continue
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        ws.column_dimensions[column_letter].width = adjusted_width
                except AttributeError:
                    # Skip merged cells or other non-standard cells
                    pass
        
        # Save to BytesIO
        wb.save(excel_buffer)
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
        
        # Use openpyxl directly to avoid BytesIO compatibility issues
        from openpyxl import Workbook
        from openpyxl.utils.dataframe import dataframe_to_rows
        
        wb = Workbook()
        ws = wb.active
        if ws is not None:
            ws.title = 'Orders'
            
            # Add data from DataFrame
            for r in dataframe_to_rows(df, index=False, header=True):
                ws.append(r)
            
            # Auto-adjust column widths
            for column in ws.columns:
                max_length = 0
                try:
                    first_cell = column[0]
                    if hasattr(first_cell, 'column_letter'):
                        column_letter = getattr(first_cell, 'column_letter', None)
                        if column_letter is None:
                            continue
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        ws.column_dimensions[column_letter].width = adjusted_width
                except AttributeError:
                    # Skip merged cells or other non-standard cells
                    pass
        
        # Save to BytesIO
        wb.save(excel_buffer)
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
            if db_service.transcripts_collection is None:
                return {"total_rooms": 0, "total_transcripts": 0, "rooms": {}}
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
            # Get from memory storage - exclude draft orders
            for room_id, order_data in db_service._memory_orders.items():
                # Skip draft orders - only show confirmed/pending orders
                if order_data.get("order_status") == "draft":
                    continue
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
            # Get from MongoDB - exclude draft orders
            if db_service.orders_collection is None:
                return {"total_orders": 0, "orders": {}}
            cursor = db_service.orders_collection.find({"order_status": {"$ne": "draft"}})
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

@app.get("/orders/user/{user_id}")
async def get_user_orders(user_id: str):
    """Get orders for a specific user (by customer_id or customer email)"""
    try:
        user_orders = {}
        
        if db_service.use_memory:
            # Get from memory storage - filter by customer_id and exclude draft orders
            for room_id, order_data in db_service._memory_orders.items():
                # Skip draft orders - only show confirmed/pending orders that user submitted
                if order_data.get("order_status") == "draft":
                    continue
                if order_data.get("customer_id") == user_id or order_data.get("customer_name") == user_id:
                    user_orders[room_id] = OrderData(
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
            # Get from MongoDB - filter by customer_id or customer_name, exclude draft orders
            if db_service.orders_collection is None:
                return {"total_orders": 0, "orders": {}}
            cursor = db_service.orders_collection.find({
                "$and": [
                    {
                        "$or": [
                            {"customer_id": user_id},
                            {"customer_name": user_id}
                        ]
                    },
                    {"order_status": {"$ne": "draft"}}  # Exclude draft orders
                ]
            })
            orders = await cursor.to_list(length=None)
            
            for order in orders:
                user_orders[order["room_id"]] = OrderData(
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
            "total_orders": len(user_orders),
            "orders": user_orders
        }
        
    except Exception as e:
        logging.error(f"Error getting user orders: {e}")
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

@app.post("/api/admin/orders/update-status")
async def update_order_status(request: dict):
    """Update order status (accept/reject)"""
    try:
        room_id = request.get("room_id")
        order_id = request.get("order_id")
        status = request.get("status")  # 'confirmed' or 'rejected'
        
        if not room_id or not order_id or not status:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Get existing order
        order = await db_service.get_order(room_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order status
        order['order_status'] = status
        order['updated_at'] = datetime.utcnow()
        
        # Store updated order
        await db_service.store_order(room_id, order)
        
        logging.info(f"Order {order_id} status updated to {status}")
        
        return {
            "success": True,
            "message": f"Order {status} successfully",
            "order_id": order_id,
            "status": status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating order status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update order status: {str(e)}")

@app.post("/api/admin/orders/send-confirmation")
async def send_order_confirmation_email(request: dict):
    """Send order confirmation/rejection email to customer"""
    try:
        order_id = request.get("order_id")
        customer_email = request.get("customer_email")
        customer_name = request.get("customer_name")
        book_title = request.get("book_title")
        status = request.get("status")  # 'confirmed' or 'rejected'
        order_details = request.get("order_details", {})
        
        if not order_id or not customer_email or not status:
            raise HTTPException(status_code=400, detail="Missing required fields: order_id, customer_email, and status")
        
        # Ensure customer_email is a valid string
        if not isinstance(customer_email, str) or not customer_email.strip():
            raise HTTPException(status_code=400, detail="Invalid customer email")
        
        # Check SMTP configuration
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            logging.warning("SMTP not configured, skipping email")
            return {"success": True, "message": "Email skipped (SMTP not configured)"}
        
        # Prepare email
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = customer_email
        
        if status == 'confirmed':
            msg['Subject'] = f"Order Confirmed - {book_title or 'Your Book Order'}"
            body = f"""
Dear {customer_name or 'Customer'},

Great news! Your book order has been confirmed! 🎉

Order Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Book Title: {book_title or 'N/A'}
✍️  Author: {order_details.get('author', 'N/A')}
📦 Quantity: {order_details.get('quantity', 1)}
💰 Total Amount: ${order_details.get('total_amount', 0):.2f}
💳 Payment Method: {order_details.get('payment_method', 'N/A')}
🚚 Delivery Option: {order_details.get('delivery_option', 'N/A')}
📍 Delivery Address: {order_details.get('delivery_address', 'N/A')}
🆔 Order ID: {order_id}

Your order will be processed and shipped soon. You will receive a tracking number once your order is dispatched.

Thank you for choosing BookWise! 📖

Best regards,
BookWise Team
            """
        else:  # rejected
            msg['Subject'] = f"Order Update - {book_title or 'Your Book Order'}"
            body = f"""
Dear {customer_name or 'Customer'},

We regret to inform you that we are unable to process your order at this time.

Order Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Book Title: {book_title or 'N/A'}
🆔 Order ID: {order_id}

Possible reasons:
• Book is currently out of stock
• Delivery not available to your location
• Payment verification issues

Please contact our customer support for more information or to place a new order.

We apologize for any inconvenience caused.

Best regards,
BookWise Team
            """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USERNAME, customer_email, text)
        server.quit()
        
        logging.info(f"Order {status} email sent to {customer_email} for order {order_id}")
        
        return {
            "success": True,
            "message": f"Confirmation email sent successfully",
            "order_id": order_id,
            "recipient": customer_email
        }
        
    except Exception as e:
        logging.error(f"Error sending confirmation email: {e}")
        # Don't fail the request if email fails
        return {
            "success": False,
            "message": f"Failed to send email: {str(e)}",
            "order_id": order_id
        }

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

# Sentiment Analysis Endpoints
@app.post("/sentiment/analyze")
async def analyze_sentiment(request: Dict[str, str]):
    """Analyze sentiment of a single message"""
    try:
        message = request.get("message", "")
        user_id = request.get("user_id", "default")
        
        if not message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        sentiment_score = await sentiment_engine.analyze_message_sentiment(message, user_id)
        
        return {
            "overall_sentiment": sentiment_score.overall_sentiment.value,
            "confidence": sentiment_score.confidence,
            "polarity": sentiment_score.polarity,
            "subjectivity": sentiment_score.subjectivity,
            "intensity": sentiment_score.intensity,
            "emotions": sentiment_score.emotions,
            "sales_metrics": {
                "urgency": sentiment_score.urgency,
                "engagement": sentiment_score.engagement,
                "satisfaction": sentiment_score.satisfaction,
                "purchase_intent": sentiment_score.purchase_intent,
                "objection_level": sentiment_score.objection_level,
                "trust_level": sentiment_score.trust_level
            },
            "metadata": {
                "timestamp": sentiment_score.timestamp.isoformat(),
                "message_length": sentiment_score.message_length,
                "processing_time": sentiment_score.processing_time
            }
        }
        
    except Exception as e:
        logging.error(f"Error in sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")

@app.get("/sentiment/shifts/{room_id}")
async def get_sentiment_shifts(room_id: str):
    """Get sentiment shifts for a specific room/conversation"""
    try:
        shifts = sentiment_engine.detect_sentiment_shifts(room_id)
        
        return {
            "room_id": room_id,
            "shifts_count": len(shifts),
            "shifts": [
                {
                    "previous_sentiment": shift.previous_sentiment.value,
                    "current_sentiment": shift.current_sentiment.value,
                    "shift_magnitude": shift.shift_magnitude,
                    "shift_direction": shift.shift_direction,
                    "trigger_phrases": shift.trigger_phrases,
                    "timestamp": shift.timestamp.isoformat(),
                    "confidence": shift.confidence
                } for shift in shifts
            ]
        }
        
    except Exception as e:
        logging.error(f"Error getting sentiment shifts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get sentiment shifts: {str(e)}")

@app.get("/sentiment/summary/{room_id}")
async def get_conversation_sentiment_summary(room_id: str):
    """Get comprehensive sentiment summary for a conversation"""
    try:
        summary = sentiment_engine.get_conversation_summary(room_id)
        
        if "error" in summary:
            raise HTTPException(status_code=404, detail=summary["error"])
        
        return {
            "room_id": room_id,
            "summary": summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting conversation summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get conversation summary: {str(e)}")

@app.get("/sentiment/realtime/{room_id}")
async def get_realtime_sentiment(room_id: str):
    """Get real-time sentiment data for a room"""
    try:
        # Get recent sentiment data from database
        sentiment_data = await db_service.get_sentiment_data(room_id)
        
        if not sentiment_data:
            return {
                "room_id": room_id,
                "current_sentiment": None,
                "recent_analysis": []
            }
        
        # Get the most recent sentiment
        current_sentiment = sentiment_data[-1] if sentiment_data else None
        
        return {
            "room_id": room_id,
            "current_sentiment": current_sentiment,
            "recent_analysis": sentiment_data[-10:],  # Last 10 analyses
            "total_analyses": len(sentiment_data)
        }
        
    except Exception as e:
        logging.error(f"Error getting real-time sentiment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get real-time sentiment: {str(e)}")

@app.delete("/sentiment/clear/{room_id}")
async def clear_sentiment_history(room_id: str):
    """Clear sentiment history for a room (for testing/debugging)"""
    try:
        if room_id in sentiment_engine.sentiment_history:
            del sentiment_engine.sentiment_history[room_id]
        
        # Also clear from database
        await db_service.clear_sentiment_data(room_id)
        
        return {
            "message": f"Sentiment history cleared for room {room_id}",
            "room_id": room_id
        }
        
    except Exception as e:
        logging.error(f"Error clearing sentiment history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear sentiment history: {str(e)}")

# Product Recommendation Endpoints
@app.get("/recommendations/{customer_id}")
async def get_product_recommendations(customer_id: str, conversation_context: str = "", max_recommendations: int = 5):
    """Get personalized product recommendations for a customer"""
    try:
        recommendations = await recommendation_engine.get_recommendations(
            customer_id=customer_id,
            conversation_context=conversation_context,
            max_recommendations=max_recommendations
        )
        
        # Convert recommendations to dictionary format
        recommendations_data = []
        for rec in recommendations:
            recommendations_data.append({
                "book_id": rec.book.book_id,
                "title": rec.book.title,
                "author": rec.book.author,
                "genre": rec.book.genre.value,
                "price": rec.book.price,
                "rating": rec.book.rating,
                "description": rec.book.description,
                "confidence_score": rec.confidence_score,
                "reason": rec.reason,
                "recommendation_type": rec.recommendation_type,
                "discount_available": rec.discount_available,
                "discount_percentage": rec.discount_percentage
            })
        
        return {
            "customer_id": customer_id,
            "recommendations": recommendations_data,
            "total_recommendations": len(recommendations_data)
        }
        
    except Exception as e:
        logging.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@app.get("/books/search")
async def search_books(query: str, genre: str = None, max_price: float = None):
    """Search books by title, author, or description"""
    try:
        from product_recommendation import BookGenre
        
        genre_enum = None
        if genre:
            try:
                genre_enum = BookGenre(genre)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid genre: {genre}")
        
        books = await recommendation_engine.search_books(
            query=query,
            genre=genre_enum,
            max_price=max_price
        )
        
        # Convert books to dictionary format
        books_data = []
        for book in books:
            books_data.append({
                "book_id": book.book_id,
                "title": book.title,
                "author": book.author,
                "genre": book.genre.value,
                "price": book.price,
                "rating": book.rating,
                "description": book.description,
                "isbn": book.isbn,
                "publication_year": book.publication_year,
                "page_count": book.page_count,
                "language": book.language,
                "availability": book.availability,
                "stock_quantity": book.stock_quantity,
                "tags": book.tags
            })
        
        return {
            "query": query,
            "books": books_data,
            "total_results": len(books_data)
        }
        
    except Exception as e:
        logging.error(f"Error searching books: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search books: {str(e)}")

@app.get("/books/{book_id}")
async def get_book_details(book_id: str):
    """Get detailed information about a specific book"""
    try:
        book = await recommendation_engine.get_book_by_id(book_id)
        
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        return {
            "book_id": book.book_id,
            "title": book.title,
            "author": book.author,
            "genre": book.genre.value,
            "price": book.price,
            "rating": book.rating,
            "description": book.description,
            "isbn": book.isbn,
            "publication_year": book.publication_year,
            "page_count": book.page_count,
            "language": book.language,
            "availability": book.availability,
            "stock_quantity": book.stock_quantity,
            "tags": book.tags,
            "similar_books": book.similar_books
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting book details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get book details: {str(e)}")

# Question Generation Endpoints
@app.post("/questions/generate")
async def generate_next_question(request: Dict[str, Any]):
    """Generate the next appropriate question for a conversation"""
    try:
        room_id = request.get("room_id")
        conversation_history = request.get("conversation_history", [])
        sentiment_data = request.get("sentiment_data")
        
        if not room_id:
            raise HTTPException(status_code=400, detail="room_id is required")
        
        if not QUESTION_GENERATOR_AVAILABLE:
            raise HTTPException(status_code=503, detail="Question generator service not available")
        
        question = await question_generator.generate_question(
            room_id=room_id,
            conversation_history=conversation_history,
            sentiment_data=sentiment_data
        )
        
        if not question:
            return {"question": None, "message": "No appropriate question found"}
        
        return {
            "question": {
                "question_id": question.question_id,
                "text": question.text,
                "question_type": question.question_type.value,
                "conversation_stage": question.conversation_stage.value,
                "context": question.context,
                "expected_response_type": question.expected_response_type,
                "follow_up_questions": question.follow_up_questions,
                "success_indicators": question.success_indicators,
                "objection_handling": question.objection_handling
            }
        }
        
    except Exception as e:
        logging.error(f"Error generating question: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate question: {str(e)}")

@app.post("/questions/handle-objection")
async def handle_customer_objection(request: Dict[str, Any]):
    """Handle customer objections with appropriate responses"""
    try:
        room_id = request.get("room_id")
        objection_text = request.get("objection_text", "")
        
        if not room_id or not objection_text:
            raise HTTPException(status_code=400, detail="room_id and objection_text are required")
        
        if not QUESTION_GENERATOR_AVAILABLE:
            raise HTTPException(status_code=503, detail="Question generator service not available")
        
        # Get conversation context
        context = question_generator.get_conversation_context(room_id)
        if not context:
            raise HTTPException(status_code=404, detail="Conversation context not found")
        
        # Handle objection
        objection_response = await question_generator.handle_objection(objection_text, context)
        
        if not objection_response:
            return {"response": None, "message": "No appropriate response found"}
        
        return {
            "response": {
                "objection_type": objection_response.objection_type.value,
                "response_text": objection_response.response_text,
                "technique": objection_response.technique,
                "follow_up_questions": objection_response.follow_up_questions,
                "confidence_boosters": objection_response.confidence_boosters
            }
        }
        
    except Exception as e:
        logging.error(f"Error handling objection: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to handle objection: {str(e)}")

@app.get("/questions/context/{room_id}")
async def get_conversation_context(room_id: str):
    """Get current conversation context for a room"""
    try:
        if not QUESTION_GENERATOR_AVAILABLE:
            return {"context": None, "message": "Question generator service not available"}
        
        context = question_generator.get_conversation_context(room_id)
        
        if not context:
            return {"context": None, "message": "No conversation context found"}
        
        return {
            "context": {
                "stage": context.stage.value,
                "customer_sentiment": context.customer_sentiment,
                "customer_engagement": context.customer_engagement,
                "purchase_intent": context.purchase_intent,
                "objection_level": context.objection_level,
                "trust_level": context.trust_level,
                "topics_discussed": context.topics_discussed,
                "questions_asked_count": len(context.questions_asked),
                "customer_responses_count": len(context.customer_responses),
                "current_topic": context.current_topic,
                "conversation_duration": context.conversation_duration
            }
        }
        
    except Exception as e:
        logging.error(f"Error getting conversation context: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get conversation context: {str(e)}")

@app.delete("/questions/clear-context/{room_id}")
async def clear_conversation_context(room_id: str):
    """Clear conversation context for a room"""
    try:
        if not QUESTION_GENERATOR_AVAILABLE:
            raise HTTPException(status_code=503, detail="Question generator service not available")
        
        question_generator.clear_conversation_context(room_id)
        
        return {
            "message": f"Conversation context cleared for room {room_id}",
            "room_id": room_id
        }
        
    except Exception as e:
        logging.error(f"Error clearing conversation context: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear conversation context: {str(e)}")

# Analytics Endpoints
@app.get("/analytics/order/{room_id}")
async def get_order_analytics(room_id: str):
    """Get order details for analytics panel"""
    try:
        # Get order data from MongoDB
        order_doc = await db_service.get_order(room_id)
        
        if not order_doc:
            raise HTTPException(status_code=404, detail="No order data found for this room")
        
        # Format order data for frontend
        order_details = {
            "order_id": order_doc.get("order_id"),
            "customer_name": order_doc.get("customer_name"),
            "phone_number": order_doc.get("customer_id"),  # customer_id is the phone number
            "book_title": order_doc.get("book_title"),
            "author": order_doc.get("author"),
            "quantity": order_doc.get("quantity", 1),
            "price": order_doc.get("unit_price", 0),
            "total_amount": order_doc.get("total_amount", 0),
            "payment_method": order_doc.get("payment_method", "not_specified"),
            "delivery_option": order_doc.get("delivery_option", "home_delivery"),
            "status": order_doc.get("order_status", "pending"),
            "created_at": order_doc.get("order_date", datetime.utcnow()).isoformat() if order_doc.get("order_date") else datetime.utcnow().isoformat()
        }
        
        return order_details
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting order analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get order analytics: {str(e)}")

@app.get("/analytics/sentiment/{room_id}")
async def get_sentiment_analytics(room_id: str):
    """Get sentiment analysis data for analytics panel"""
    try:
        # Get latest sentiment data from MongoDB
        sentiment_data = await db_service.get_latest_sentiment(room_id)
        
        if not sentiment_data:
            # Return default sentiment data if no data found
            sentiment_response = {
                "overall_sentiment": "neutral",
                "confidence_score": 0.5,
                "emotions": {
                    "joy": 0.2,
                    "anger": 0.1,
                    "fear": 0.1,
                    "sadness": 0.1,
                    "surprise": 0.1
                },
                "key_phrases": ["conversation", "assistance"],
                "conversation_stage": "initial"
            }
            return sentiment_response
        
        # Format sentiment data for frontend
        sentiment_response = {
            "overall_sentiment": sentiment_data.get("overall_sentiment", "neutral"),
            "confidence_score": sentiment_data.get("confidence", 0.5),
            "emotions": {
                "joy": sentiment_data.get("emotions", {}).get("joy", 0),
                "anger": sentiment_data.get("emotions", {}).get("anger", 0),
                "fear": sentiment_data.get("emotions", {}).get("fear", 0),
                "sadness": sentiment_data.get("emotions", {}).get("sadness", 0),
                "surprise": sentiment_data.get("emotions", {}).get("surprise", 0)
            },
            "key_phrases": sentiment_data.get("key_phrases", []),
            "conversation_stage": sentiment_data.get("conversation_stage", "initial")
        }
        
        return sentiment_response
        
    except Exception as e:
        logging.error(f"Error getting sentiment analytics: {e}")
        # Return default data instead of error
        return {
            "overall_sentiment": "neutral",
            "confidence_score": 0.5,
            "emotions": {
                "joy": 0.2,
                "anger": 0.1,
                "fear": 0.1,
                "sadness": 0.1,
                "surprise": 0.1
            },
            "key_phrases": ["conversation", "assistance"],
            "conversation_stage": "initial"
        }

@app.get("/analytics/metrics/{room_id}")
async def get_conversation_metrics(room_id: str):
    """Get conversation metrics for analytics panel"""
    try:
        # Get transcripts to calculate metrics
        transcripts = await db_service.get_transcripts(room_id)
        
        if not transcripts:
            raise HTTPException(status_code=404, detail="No conversation data found for this room")
        
        # Calculate conversation metrics
        total_words = sum(len(t.get("message", "").split()) for t in transcripts)
        user_messages = [t for t in transcripts if t.get("role") == "user"]
        assistant_messages = [t for t in transcripts if t.get("role") == "assistant"]
        
        # Calculate duration (difference between first and last message)
        timestamps = [t.get("timestamp", 0) for t in transcripts if t.get("timestamp")]
        duration = int(max(timestamps) - min(timestamps)) if len(timestamps) > 1 else 0
        
        # Calculate engagement (simple metric based on user interaction)
        customer_engagement = min(100, len(user_messages) * 10) if user_messages else 0
        
        # Count questions and recommendations (simple keyword-based detection)
        questions_asked = sum(1 for t in assistant_messages if "?" in t.get("message", ""))
        recommendations_made = sum(1 for t in assistant_messages 
                                 if any(word in t.get("message", "").lower() 
                                       for word in ["recommend", "suggest", "try", "consider"]))
        
        # Count objections (simple keyword-based detection)
        objections_handled = sum(1 for t in user_messages 
                               if any(word in t.get("message", "").lower() 
                                     for word in ["but", "however", "expensive", "not sure", "maybe"]))
        
        metrics_response = {
            "duration": duration,
            "total_words": total_words,
            "customer_engagement": customer_engagement,
            "objections_handled": objections_handled,
            "questions_asked": questions_asked,
            "recommendations_made": recommendations_made
        }
        
        return metrics_response
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting conversation metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get conversation metrics: {str(e)}")

@app.get("/sentiment/summary/{room_id}")
async def get_sentiment_summary(room_id: str):
    """Get conversation sentiment summary"""
    try:
        # Get all sentiment data for this room
        sentiment_records = await db_service.get_sentiment_data(room_id)
        
        if not sentiment_records:
            # Return default summary when no sentiment data exists
            return {
                "summary": {
                    "room_id": room_id,
                    "total_messages_analyzed": 0,
                    "overall_sentiment_trend": "neutral",
                    "sentiment_distribution": {
                        "positive": 33.3,
                        "negative": 33.3,
                        "neutral": 33.4
                    },
                    "average_confidence": 0.5,
                    "average_engagement": 0.5,
                    "average_satisfaction": 0.5,
                    "average_purchase_intent": 0.3,
                    "conversation_duration_seconds": 0,
                    "analysis_timestamp": datetime.utcnow().isoformat(),
                    "message": "No sentiment data available yet"
                }
            }
        
        # Get transcripts to calculate additional metrics
        transcripts = await db_service.get_transcripts(room_id)
        
        # Calculate summary metrics
        total_messages = len(sentiment_records)
        
        # Calculate sentiment distribution
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        total_confidence = 0
        total_engagement = 0
        total_satisfaction = 0
        total_purchase_intent = 0
        
        for record in sentiment_records:
            sentiment = record.get("overall_sentiment", "neutral")
            if sentiment in sentiment_counts:
                sentiment_counts[sentiment] += 1
            
            total_confidence += record.get("confidence", 0)
            total_engagement += record.get("engagement", 0)
            total_satisfaction += record.get("satisfaction", 0)
            total_purchase_intent += record.get("purchase_intent", 0)
        
        # Calculate averages
        avg_confidence = total_confidence / total_messages if total_messages > 0 else 0.5
        avg_engagement = total_engagement / total_messages if total_messages > 0 else 0.5
        avg_satisfaction = total_satisfaction / total_messages if total_messages > 0 else 0.5
        avg_purchase_intent = total_purchase_intent / total_messages if total_messages > 0 else 0.3
        
        # Determine overall sentiment trend
        if sentiment_counts["positive"] > sentiment_counts["negative"]:
            overall_trend = "positive"
        elif sentiment_counts["negative"] > sentiment_counts["positive"]:
            overall_trend = "negative"
        else:
            overall_trend = "neutral"
        
        # Calculate conversation duration
        if transcripts and len(transcripts) > 1:
            timestamps = [t.get("timestamp", 0) for t in transcripts if t.get("timestamp")]
            duration = int(max(timestamps) - min(timestamps)) if len(timestamps) > 1 else 0
        else:
            duration = 0
        
        summary = {
            "room_id": room_id,
            "total_messages_analyzed": total_messages,
            "overall_sentiment_trend": overall_trend,
            "sentiment_distribution": {
                "positive": round((sentiment_counts["positive"] / total_messages) * 100, 1) if total_messages > 0 else 33.3,
                "negative": round((sentiment_counts["negative"] / total_messages) * 100, 1) if total_messages > 0 else 33.3,
                "neutral": round((sentiment_counts["neutral"] / total_messages) * 100, 1) if total_messages > 0 else 33.4
            },
            "average_confidence": round(avg_confidence, 2),
            "average_engagement": round(avg_engagement, 2),
            "average_satisfaction": round(avg_satisfaction, 2),
            "average_purchase_intent": round(avg_purchase_intent, 2),
            "conversation_duration_seconds": duration,
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
        
        return {"summary": summary}
        
    except Exception as e:
        logging.error(f"Error getting sentiment summary: {e}")
        # Return default summary on error instead of raising exception
        return {
            "summary": {
                "room_id": room_id,
                "total_messages_analyzed": 0,
                "overall_sentiment_trend": "neutral",
                "sentiment_distribution": {
                    "positive": 33.3,
                    "negative": 33.3,
                    "neutral": 33.4
                },
                "average_confidence": 0.5,
                "average_engagement": 0.5,
                "average_satisfaction": 0.5,
                "average_purchase_intent": 0.3,
                "conversation_duration_seconds": 0,
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
        }

@app.post("/sentiment/analyze")
async def analyze_sentiment(request: Dict[str, Any]):
    """Analyze sentiment of a message"""
    try:
        message = request.get("message", "")
        room_id = request.get("room_id", "")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        if not SENTIMENT_AVAILABLE or sentiment_engine is None:
            # Return default sentiment analysis when service is not available
            return {
                "sentiment": "neutral",
                "confidence": 0.5,
                "polarity": 0.0,
                "subjectivity": 0.5,
                "emotions": {
                    "joy": 0.2,
                    "anger": 0.1,
                    "fear": 0.1,
                    "sadness": 0.1,
                    "surprise": 0.1
                },
                "engagement": 0.5,
                "satisfaction": 0.5,
                "purchase_intent": 0.3,
                "message": "Sentiment analysis service not available"
            }
        
        # If sentiment analysis is available, use it
        sentiment_score = await sentiment_engine.analyze_message_sentiment(message, user_id=room_id)
        
        return {
            "sentiment": sentiment_score.overall_sentiment.value,
            "confidence": sentiment_score.confidence,
            "polarity": sentiment_score.polarity,
            "subjectivity": sentiment_score.subjectivity,
            "emotions": sentiment_score.emotions,
            "engagement": sentiment_score.engagement,
            "satisfaction": sentiment_score.satisfaction,
            "purchase_intent": sentiment_score.purchase_intent,
        }
        
    except Exception as e:
        logging.error(f"Error analyzing sentiment: {e}")
        # Return neutral sentiment on error
        return {
            "sentiment": "neutral",
            "confidence": 0.5,
            "polarity": 0.0,
            "subjectivity": 0.5,
            "emotions": {
                "joy": 0.2,
                "anger": 0.1,
                "fear": 0.1,
                "sadness": 0.1,
                "surprise": 0.1
            },
            "engagement": 0.5,
            "satisfaction": 0.5,
            "purchase_intent": 0.3,
            "error": str(e)
        }

@app.get("/sentiment/shifts/{room_id}")
async def get_sentiment_shifts(room_id: str):
    """Get sentiment shifts for a conversation"""
    try:
        if not SENTIMENT_AVAILABLE or sentiment_engine is None:
            return {"shifts": []}
        
        # Get sentiment shifts from the sentiment engine
        shifts = sentiment_engine.detect_sentiment_shifts(room_id)
        
        shift_data = [
            {
                "previous_sentiment": shift.previous_sentiment.value,
                "current_sentiment": shift.current_sentiment.value,
                "shift_magnitude": shift.shift_magnitude,
                "shift_direction": shift.shift_direction,
                "trigger_phrases": shift.trigger_phrases,
                "timestamp": shift.timestamp.isoformat(),
                "confidence": shift.confidence
            } for shift in shifts
        ]
        
        return {"shifts": shift_data}
        
    except Exception as e:
        logging.error(f"Error getting sentiment shifts: {e}")
        return {"shifts": [], "error": str(e)}

@app.delete("/sentiment/clear/{room_id}")
async def clear_sentiment_data(room_id: str):
    """Clear sentiment data for a room"""
    try:
        await db_service.clear_sentiment_data(room_id)
        return {"message": f"Sentiment data cleared for room {room_id}"}
        
    except Exception as e:
        logging.error(f"Error clearing sentiment data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear sentiment data: {str(e)}")

@app.get("/sentiment/realtime/{room_id}")
async def get_realtime_sentiment(room_id: str):
    """Get real-time sentiment data for a room"""
    try:
        # Get latest sentiment data
        latest_sentiment = await db_service.get_latest_sentiment(room_id)
        
        if not latest_sentiment:
            return {
                "current_sentiment": "neutral",
                "confidence": 0.5,
                "engagement": 0.5,
                "satisfaction": 0.5,
                "purchase_intent": 0.3,
                "last_updated": datetime.utcnow().isoformat(),
                "message": "No sentiment data available"
            }
        
        return {
            "current_sentiment": latest_sentiment.get("overall_sentiment", "neutral"),
            "confidence": latest_sentiment.get("confidence", 0.5),
            "engagement": latest_sentiment.get("engagement", 0.5),
            "satisfaction": latest_sentiment.get("satisfaction", 0.5),
            "purchase_intent": latest_sentiment.get("purchase_intent", 0.3),
            "emotions": latest_sentiment.get("emotions", {}),
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logging.error(f"Error getting realtime sentiment: {e}")
        return {
            "current_sentiment": "neutral",
            "confidence": 0.5,
            "engagement": 0.5,
            "satisfaction": 0.5,
            "purchase_intent": 0.3,
            "last_updated": datetime.utcnow().isoformat(),
            "error": str(e)
        }

# ============================================
# CALL SUMMARY ENDPOINTS - Module 4
# ============================================

@app.post("/api/call-summary/generate/{room_id}")
async def generate_call_summary(room_id: str, manual_notes: Optional[str] = None):
    """
    Generate comprehensive call summary with insights
    
    This endpoint automatically:
    - Extracts key points from call transcripts
    - Identifies customer objections and concerns
    - Tracks product/book interests
    - Analyzes conversation flow and outcomes
    - Provides actionable recommendations for improvement
    """
    try:
        if not CALL_SUMMARY_AVAILABLE or summary_generator is None:
            raise HTTPException(status_code=503, detail="Call summary generator not available")
        
        # Get transcripts from database
        transcripts_raw = await db_service.get_transcripts(room_id)
        if not transcripts_raw:
            raise HTTPException(status_code=404, detail=f"No transcripts found for room {room_id}")
        
        # Convert to expected format
        transcripts = [
            {
                "id": t.get("id"),
                "role": t.get("role"),
                "message": t.get("message"),
                "timestamp": t.get("timestamp")
            } for t in transcripts_raw
        ]
        
        # Get order data
        order_doc = await db_service.get_order(room_id)
        order_data = None
        if order_doc:
            order_data = {
                "order_id": order_doc.get("order_id"),
                "customer_id": order_doc.get("customer_id"),
                "customer_name": order_doc.get("customer_name"),
                "book_title": order_doc.get("book_title"),
                "author": order_doc.get("author"),
                "genre": order_doc.get("genre"),
                "quantity": order_doc.get("quantity"),
                "unit_price": order_doc.get("unit_price"),
                "total_amount": order_doc.get("total_amount"),
                "payment_method": order_doc.get("payment_method"),
                "delivery_option": order_doc.get("delivery_option"),
                "delivery_address": order_doc.get("delivery_address"),
                "order_status": order_doc.get("order_status", "pending"),
                "order_date": order_doc.get("order_date"),
                "special_requests": order_doc.get("special_requests"),
            }
        
        # Get sentiment data
        sentiment_data = await db_service.get_sentiment_data(room_id)
        
        # Generate summary
        summary = await summary_generator.generate_summary(
            room_id=room_id,
            transcripts=transcripts,
            order_data=order_data,
            sentiment_data=sentiment_data,
            manual_notes=manual_notes
        )
        
        # Store summary in database
        summary_dict = summary.to_dict()
        await db_service.store_call_summary(room_id, summary_dict)
        
        logging.info(f"Generated and stored call summary for room {room_id}")
        
        return {
            "message": "Call summary generated successfully",
            "summary": summary_dict
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generating call summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate call summary: {str(e)}")


@app.get("/api/call-summary/{room_id}")
async def get_call_summary(room_id: str):
    """Get call summary for a specific room/call"""
    try:
        summary = await db_service.get_call_summary(room_id)
        
        if not summary:
            raise HTTPException(status_code=404, detail=f"No call summary found for room {room_id}")
        
        return {
            "summary": summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting call summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get call summary: {str(e)}")


@app.get("/api/call-summaries/all")
async def get_all_call_summaries(limit: int = 100):
    """Get all call summaries (for admin/analytics)"""
    try:
        summaries = await db_service.get_all_call_summaries(limit=limit)
        
        return {
            "total": len(summaries),
            "summaries": summaries
        }
        
    except Exception as e:
        logging.error(f"Error getting all call summaries: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get call summaries: {str(e)}")


@app.get("/api/call-summaries/by-outcome/{outcome}")
async def get_summaries_by_outcome(outcome: str):
    """
    Get call summaries filtered by outcome
    
    Outcomes:
    - success: Order placed successfully
    - partial_success: Interest shown but no order
    - no_sale: Customer decided not to purchase
    - information_only: Just gathering information
    """
    try:
        valid_outcomes = ["success", "partial_success", "no_sale", "information_only"]
        if outcome not in valid_outcomes:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid outcome. Must be one of: {', '.join(valid_outcomes)}"
            )
        
        summaries = await db_service.get_summaries_by_outcome(outcome)
        
        return {
            "outcome": outcome,
            "total": len(summaries),
            "summaries": summaries
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting summaries by outcome: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get summaries by outcome: {str(e)}")


@app.delete("/api/call-summary/{room_id}")
async def delete_call_summary(room_id: str):
    """Delete call summary for a room"""
    try:
        deleted = await db_service.delete_call_summary(room_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail=f"No call summary found for room {room_id}")
        
        return {
            "message": f"Call summary deleted successfully for room {room_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting call summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete call summary: {str(e)}")


@app.post("/api/call-end-report/{room_id}")
async def get_call_end_report(room_id: str, manual_notes: Optional[str] = None):
    """
    Generate complete call end report - Called when call ends
    
    Returns comprehensive report including:
    1. Call Summary with actionable insights
    2. Sentiment Analysis with journey and metrics
    3. Complete Transcripts
    4. Order Data (if available)
    
    This is the main endpoint to call when a call session ends.
    """
    try:
        if not CALL_END_HANDLER_AVAILABLE or not CALL_SUMMARY_AVAILABLE:
            raise HTTPException(
                status_code=503, 
                detail="Call end report generation not available"
            )
        
        # Generate complete report
        report = await generate_call_end_report(
            room_id=room_id,
            db_service=db_service,
            summary_generator=summary_generator,
            manual_notes=manual_notes
        )
        
        logging.info(f"Call end report generated for room {room_id}")
        
        return {
            "success": True,
            "message": "Call end report generated successfully",
            "report": report.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generating call end report: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate call end report: {str(e)}"
        )


@app.get("/api/call-summaries/analytics")
async def get_call_summaries_analytics():
    """
    Get analytics and insights from all call summaries
    
    Provides aggregated metrics:
    - Total calls analyzed
    - Success rate
    - Average customer satisfaction
    - Common objections
    - Top improvement areas
    - Agent performance metrics
    """
    try:
        summaries = await db_service.get_all_call_summaries(limit=1000)
        
        if not summaries:
            return {
                "total_calls": 0,
                "message": "No call summaries available for analysis"
            }
        
        # Calculate analytics
        total_calls = len(summaries)
        successful_calls = len([s for s in summaries if s.get("call_outcome") == "success"])
        success_rate = (successful_calls / total_calls * 100) if total_calls > 0 else 0
        
        # Average satisfaction
        satisfactions = [s.get("customer_satisfaction", 0) for s in summaries if s.get("customer_satisfaction")]
        avg_satisfaction = sum(satisfactions) / len(satisfactions) if satisfactions else 0
        
        # Average objection handling score
        objection_scores = [s.get("objection_handling_score", 0) for s in summaries if s.get("objection_handling_score") is not None]
        avg_objection_handling = sum(objection_scores) / len(objection_scores) if objection_scores else 0
        
        # Count outcomes
        outcomes = {}
        for summary in summaries:
            outcome = summary.get("call_outcome", "unknown")
            outcomes[outcome] = outcomes.get(outcome, 0) + 1
        
        # Aggregate objections
        all_objections = []
        for summary in summaries:
            objections = summary.get("objections_raised", [])
            for obj in objections:
                if isinstance(obj, dict):
                    all_objections.append(obj.get("type", "unknown"))
        
        from collections import Counter
        objection_counts = Counter(all_objections)
        top_objections = [{"type": obj_type, "count": count} 
                         for obj_type, count in objection_counts.most_common(5)]
        
        # Aggregate improvement areas
        all_improvements = []
        for summary in summaries:
            improvements = summary.get("improvement_areas", [])
            all_improvements.extend(improvements)
        
        improvement_counts = Counter(all_improvements)
        top_improvements = [{"area": area, "count": count} 
                          for area, count in improvement_counts.most_common(5)]
        
        # Agent performance distribution
        performance_levels = {"excellent": 0, "good": 0, "needs_improvement": 0}
        for summary in summaries:
            quality = summary.get("agent_response_quality", "")
            if quality in performance_levels:
                performance_levels[quality] += 1
        
        # Average recommendations made
        recommendations = [s.get("recommendations_made", 0) for s in summaries]
        avg_recommendations = sum(recommendations) / len(recommendations) if recommendations else 0
        
        return {
            "total_calls": total_calls,
            "success_rate": round(success_rate, 2),
            "average_satisfaction": round(avg_satisfaction, 2),
            "average_objection_handling_score": round(avg_objection_handling, 2),
            "average_recommendations_made": round(avg_recommendations, 2),
            "outcomes_distribution": outcomes,
            "top_objections": top_objections,
            "top_improvement_areas": top_improvements,
            "agent_performance_distribution": performance_levels,
            "analysis_date": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logging.error(f"Error generating call summaries analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate analytics: {str(e)}")