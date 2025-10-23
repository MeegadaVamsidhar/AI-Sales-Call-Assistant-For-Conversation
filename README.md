# 🚀 AI Sales Call Assistant for Book Sales

A comprehensive AI-powered sales assistant system that enables voice-based book consultations with real-time transcription, order processing, and admin management capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Admin Registration System](#admin-registration-system)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

The AI Sales Call Assistant is a modern, full-stack application designed to revolutionize book sales through AI-powered voice interactions. The system combines real-time voice processing, intelligent conversation analysis, and automated order management to create a seamless sales experience.

### Key Components

1. **🎤 Voice AI Agent** - LiveKit-powered voice assistant with Deepgram STT/TTS
2. **🔧 FastAPI Backend** - RESTful API with MongoDB integration
3. **🌐 Next.js Frontend** - Modern React-based user interface
4. **👤 Admin System** - Comprehensive admin management with email verification

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   LiveKit       │
│   Frontend      │◄──►│   Backend       │◄──►│   Agent         │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Voice AI)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User          │    │   MongoDB       │    │   Deepgram      │
│   Interface     │    │   Database      │    │   STT/TTS       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: FastAPI, Python, Pydantic, Motor (MongoDB driver)
- **Database**: MongoDB with in-memory fallback
- **Voice AI**: LiveKit, Deepgram STT/TTS, Google Gemini LLM
- **Authentication**: NextAuth.js with email verification
- **Email**: SMTP with HTML templates

## ✨ Features

### 🎯 Core Features
- **Real-time Voice Interaction** - Natural conversation with AI assistant
- **Intelligent Order Processing** - Automatic extraction of customer details
- **Live Transcription** - Real-time speech-to-text conversion
- **Order Management** - Complete order lifecycle management
- **Customer Feedback** - Integrated feedback and rating system

### 👤 Admin Features
- **Secure Registration** - Email verification with manual approval
- **Employee ID Assignment** - Auto-generated after verification
- **Order Dashboard** - Comprehensive order management interface
- **Analytics & Reporting** - Sales insights and performance metrics
- **Customer Management** - Customer data and interaction history

### 🔒 Security Features
- **Email Verification** - Multi-step admin approval process
- **Password Hashing** - Secure password storage with salt
- **Rate Limiting** - Protection against brute force attacks
- **CORS Protection** - Secure cross-origin resource sharing
- **Input Validation** - Comprehensive data validation

## 📋 Prerequisites

### System Requirements
- **Node.js** 18+ and npm/pnpm
- **Python** 3.8+
- **MongoDB** (optional - has in-memory fallback)
- **Git** for version control

### External Services (Optional)
- **LiveKit** account for voice features
- **Deepgram** account for STT/TTS
- **Google Gemini** API for LLM
- **SMTP Server** for email notifications

## 🔐 Environment Setup

### 🚨 Important: Secure Your Credentials

This project uses environment variables to store sensitive information. **Never commit `.env` files to version control.**

### 1. Backend Environment Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your actual credentials:

```env
# Database Configuration
DATABASE_URL=mongodb://localhost:27017
DB_NAME=agent_starter_db

# LiveKit Configuration (Get from https://livekit.io/)
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Email Configuration (Gmail App Password recommended)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password  # Use Gmail App Password, not regular password
SMTP_FROM=your_email@gmail.com
ADMIN_EMAIL=your_admin_email@gmail.com
```

### 2. Agent Environment Configuration

```bash
cd agent
cp .env.example .env
```

Edit `agent/.env` with your actual credentials:

```env
# LiveKit Cloud (Same as backend)
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Deepgram (Get from https://deepgram.com/)
DEEPGRAM_API_KEY=your_deepgram_api_key

# Google Gemini (Get from https://ai.google.dev/)
GOOGLE_API_KEY=your_google_api_key

# Optional model overrides
DEEPGRAM_STT_MODEL=nova-3
DEEPGRAM_TTS_MODEL=aura-asteria-en
GOOGLE_LLM_MODEL=gemini-2.0-flash-001

ADMIN_EMAIL=your_admin_email@gmail.com
```

### 🔑 How to Get API Keys

1. **LiveKit**: Sign up at [livekit.io](https://livekit.io/) → Dashboard → Settings → Keys
2. **Deepgram**: Sign up at [deepgram.com](https://deepgram.com/) → API Keys → Create New Key
3. **Google Gemini**: Visit [ai.google.dev](https://ai.google.dev/) → Get API Key
4. **Gmail App Password**: 
   - Enable 2FA on your Google account
   - Go to Google Account Settings → Security → App Passwords
   - Generate app password for "Mail"

### ⚠️ Security Notes

- **Never commit `.env` files** - They're already in `.gitignore`
- **Use App Passwords** for Gmail, not your regular password
- **Rotate keys regularly** for production use
- **Use different credentials** for development and production

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Springboard16_10

# Make the script executable (Linux/Mac)
chmod +x run-all.sh

# Run the automated setup
./run-all.sh
```

The script will:
- ✅ Check port availability (3000, 8000)
- ✅ Create virtual environments
- ✅ Install all dependencies
- ✅ Create default configuration files
- ✅ Start all services
- ✅ Verify service health

### Option 2: Manual Setup

See [Manual Setup](#manual-setup) section below.

## 🔧 Manual Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd agent-starter-react

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

### 3. Agent Setup

```bash
cd agent

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the agent
python app.py dev
```

## 👤 Admin Registration System

The system implements a secure, multi-step admin registration process:

### Registration Workflow

1. **Admin Registration** 📝
   - Visit: `http://localhost:3000/auth/admin-signup`
   - Provide: Name, Email, Password, Department
   - **No Employee ID required** (assigned after approval)

2. **Email Verification** 📧
   - System sends verification email to: `meegadavamsi76@gmail.com`
   - Admin receives notification about pending approval
   - Verification token expires in 7 days

3. **Manual Approval** ✅
   - Administrator clicks approval link in email
   - System generates unique Employee ID (format: `EMP20241023ABC123`)
   - Account status changed to "active"

4. **Login Credentials** 🔐
   - Admin receives email with Employee ID and login instructions
   - Login using: Employee ID + Password
   - Access granted to admin dashboard

### Admin Features

- **Order Management** - View and manage all customer orders
- **Customer Analytics** - Insights into customer behavior
- **Feedback Review** - Monitor customer satisfaction
- **System Configuration** - Manage application settings

## ⚙️ Configuration

### Backend Configuration (.env)

```env
# MongoDB Configuration
DATABASE_URL=mongodb://localhost:27017
DB_NAME=agent_starter_db

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=meegadavamsi76@gmail.com

# LiveKit Configuration
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# Security
JWT_SECRET=your-jwt-secret-key
```

### Frontend Configuration (.env.local)

```env
# Backend API URL
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=mongodb://localhost:27017
DB_NAME=agent_starter_db

# LiveKit
LIVEKIT_URL=wss://your-livekit-url
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

## 📖 API Documentation

### Core Endpoints

#### Authentication
- `POST /api/auth/admin/register` - Admin registration
- `GET /api/auth/admin/verify-email` - Email verification
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout

#### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders/submit` - Submit new order
- `PUT /api/orders/{id}` - Update order status

#### Transcription
- `POST /process-transcription` - Process voice transcription
- `GET /rooms/{room_id}` - Get room data

#### Health & Monitoring
- `GET /health` - Service health check
- `GET /docs` - Interactive API documentation

### Data Models

#### Admin Registration
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "department": "Sales"
}
```

#### Order Data
```json
{
  "customer_name": "Jane Smith",
  "book_title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "quantity": 2,
  "payment_method": "credit_card",
  "delivery_option": "home_delivery"
}
```

## 🔍 Service URLs

After starting all services:

- **🌐 Main Application**: http://localhost:3000
- **👤 Admin Registration**: http://localhost:3000/auth/admin-signup
- **🔐 Admin Login**: http://localhost:3000/auth/login
- **📖 API Documentation**: http://localhost:8000/docs
- **❤️ Health Check**: http://localhost:8000/health

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <process-id> /F
```

#### 2. MongoDB Connection Issues
- Ensure MongoDB is running: `net start MongoDB`
- Check connection string in `.env`
- System falls back to in-memory storage if MongoDB unavailable

#### 3. Email Not Sending
- Verify SMTP credentials in backend `.env`
- Check firewall/antivirus blocking SMTP
- System logs verification URL for manual testing

#### 4. Admin Registration Fails
- Check backend logs: `tail -f logs/backend.log`
- Verify Next.js API routes exist
- Ensure backend is running on port 8000

### Useful Commands

```bash
# Monitor all logs
tail -f logs/backend.log logs/frontend.log logs/agent.log

# Stop all services
pkill -f 'uvicorn|pnpm|python.*app.py'

# Test backend health
curl http://localhost:8000/health

# Test admin registration endpoint
curl -X POST http://localhost:8000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'
```

## 📁 Project Structure

```
Springboard16_10/
├── agent/                  # LiveKit Voice Agent
│   ├── app.py             # Main agent application
│   ├── requirements.txt   # Python dependencies
│   └── venv/             # Virtual environment
├── agent-starter-react/   # Next.js Frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/             # Utility libraries
│   └── package.json     # Node dependencies
├── backend/              # FastAPI Backend
│   ├── main.py          # Main API application
│   ├── database.py      # Database operations
│   ├── requirements.txt # Python dependencies
│   └── .venv/          # Virtual environment
├── logs/                # Application logs
├── run-all.sh          # Automated setup script
└── README.md           # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review logs in the `logs/` directory
- Open an issue on GitHub
- Contact: meegadavamsi76@gmail.com

---

**🚀 Ready to revolutionize book sales with AI? Get started now!**

Visit http://localhost:3000 after running the setup to begin your AI-powered sales journey.
