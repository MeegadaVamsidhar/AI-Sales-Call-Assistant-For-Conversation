# FastAPI Backend

RESTful API backend for the AI Sales Call Assistant with MongoDB integration, admin management, and order processing.

## Project Structure

```
backend/
├── core/              # Core business logic
│   ├── call_end_handler.py
│   ├── call_summary_generator.py
│   └── call_summary_helpers.py
├── db/                # Database layer
│   └── database.py
├── services/          # AI Services
│   ├── sentiment_analysis.py
│   ├── product_recommendation.py
│   └── question_generator.py
├── api/               # API endpoints (scaffolded)
├── utils/             # Utilities (scaffolded)
├── config/            # Configuration (scaffolded)
├── templaets/         # HTML templates
├── tests/             # Test files
├── main.py            # Main FastAPI application
└── requirements.txt   # Python dependencies
```

## Quick Start

### 1. Setup Virtual Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL=mongodb://localhost:27017
DB_NAME=agent_starter_db

# LiveKit
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Email (Gmail App Password recommended)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
ADMIN_EMAIL=your_admin_email@gmail.com
```

### 3. Start Server

```bash
# Option 1: Using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Option 2: Using start script
python start_server.py
```

## API Endpoints

### Authentication
- `POST /api/auth/admin/register` - Admin registration
- `GET /api/auth/admin/verify-email` - Email verification
- `POST /api/auth/login` - Admin login

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders/submit` - Submit new order
- `PUT /api/orders/{id}` - Update order status

### Recommendations
- `GET /recommendations/{customer_id}` - Get personalized book recommendations
- `GET /books/search` - Search books by query, genre, or price

### Transcription & Calls
- `POST /process-transcription` - Process voice transcription
- `GET /rooms/{room_id}` - Get room data
- `POST /api/call-end-report/{room_id}` - Generate call summary

### Feedback
- `POST /feedback` - Submit customer feedback
- `GET /feedback/all` - Get all feedback
- `GET /feedback/room/{room_id}` - Get feedback for specific call

### Health & Docs
- `GET /health` - Service health check
- `GET /docs` - Interactive API documentation (Swagger UI)

## API Keys Required

1. **LiveKit** - [livekit.io](https://livekit.io/) -> Dashboard -> Settings -> Keys
2. **Gmail App Password** - Google Account -> Security -> App Passwords

## Testing

```bash
# Run specific tests
python tests/test_server.py
python tests/test_mongodb.py
python tests/test_email.py
```

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <process-id> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `DATABASE_URL` in `.env`
- System falls back to in-memory storage if MongoDB unavailable

### Email Not Sending
- Verify SMTP credentials in `.env`
- Use Gmail App Password (not regular password)
- Check firewall/antivirus settings

## Access Points

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Admin Dashboard**: http://localhost:8000/admin (if configured)

## Security Notes

- Never commit `.env` files
- Use App Passwords for Gmail
- Rotate API keys regularly
- Enable CORS only for trusted origins
