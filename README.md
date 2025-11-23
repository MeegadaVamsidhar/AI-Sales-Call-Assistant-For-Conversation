# 🚀 AI Sales Call Assistant for Book Sales

A comprehensive AI-powered sales assistant system that enables voice-based book consultations with real-time transcription, order processing, and admin management capabilities.

> 📚 **Quick Links to Component Documentation:**
> - [📖 Backend README](./backend/README.md) - FastAPI server setup & API docs
> - [📖 Agent README](./agent/README.md) - Voice AI agent configuration
> - [📖 Frontend README](./agent-starter-react/README.md) - Next.js app setup

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Component READMEs](#manual-setup)
- [Admin Registration System](#admin-registration-system)
- [API Documentation](#api-documentation)
- [Service URLs](#service-urls)
- [Project Structure](#project-structure)
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

- **🎤 Real-time Voice AI** - Natural conversation with intelligent order processing
- **📊 Post-Call Analytics** - Automatic summaries, sentiment analysis, and transcripts
- **🤖 AI Personalization** - Context-aware recommendations based on user profiles (Regular vs VIP)
- **👤 User Switching** - Toggle between different customer profiles to demonstrate personalization
- **👤 Admin Dashboard** - Secure registration, order management, and analytics
- **🔒 Security** - Email verification, password hashing, rate limiting, CORS protection

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

### Manual Setup

See [Manual Setup](#manual-setup) section below.

## 🔧 Manual Setup

### 📚 Component Documentation

Each component has its own detailed README with comprehensive setup instructions:

| Component | Description | Documentation |
|-----------|-------------|---------------|
| **Backend** | FastAPI server, database, API endpoints | [📖 Backend README](./backend/README.md) |
| **Agent** | LiveKit voice AI with Deepgram & Gemini | [📖 Agent README](./agent/README.md) |
| **Frontend** | Next.js React application | [📖 Frontend README](./agent-starter-react/README.md) |

### Quick Setup Summary

```bash
# 1. Backend (Port 8000)
cd backend
python -m venv .venv && .venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env  # Configure your credentials
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 2. Frontend (Port 3000)
cd agent-starter-react
pnpm install
cp .env.example .env.local  # Configure your credentials
pnpm dev

# 3. Agent
cd agent
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env  # Configure your credentials
python app.py dev
```

> 💡 **See individual README files for detailed setup instructions, troubleshooting, and configuration options.**

## 👤 Admin Registration System

Secure multi-step registration process:

1. **Registration** - Visit `/auth/admin-signup` and provide name, email, password, department
2. **Email Verification** - System sends verification email (expires in 7 days)
3. **Manual Approval** - Admin clicks approval link, system generates Employee ID
4. **Login** - Use Employee ID + Password to access dashboard


## 📖 API Documentation

Complete API documentation available at: **http://localhost:8000/docs** (Swagger UI)

### Quick Reference

- **Authentication** - Admin registration, login, email verification
- **Orders** - Create, list, and update orders
- **Transcription** - Process voice calls and room data
- **Feedback** - Submit and retrieve customer feedback
- **Post-Call** - Automatic summaries, sentiment analysis, transcripts

> 📚 **For detailed API endpoints and data models, see [Backend README](./backend/README.md)**

## 🔍 Service URLs

After starting all services:

- **🌐 Main Application**: http://localhost:3000
- **👤 Admin Registration**: http://localhost:3000/auth/admin-signup
- **🔐 Admin Login**: http://localhost:3000/auth/login
- **📊 Call Summary**: http://localhost:3000/call-summary/{roomId}
- **⭐ Feedback**: http://localhost:3000/feedback/{roomId}
- **📖 API Documentation**: http://localhost:8000/docs
- **❤️ Health Check**: http://localhost:8000/health

## 🎨 UI/UX Features

- **Dark Mode** - Modern slate color palette optimized for readability
- **Responsive Design** - Mobile-first approach with adaptive layouts
- **User Experience** - Smooth transitions, loading states, and toast notifications

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
# Test backend health
curl http://localhost:8000/health

# Test admin registration endpoint
curl -X POST http://localhost:8000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'
```

> 💡 **For component-specific troubleshooting, see individual README files:**
> - [Backend Troubleshooting](./backend/README.md#troubleshooting)
> - [Agent Troubleshooting](./agent/README.md#troubleshooting)
> - [Frontend Troubleshooting](./agent-starter-react/README.md#troubleshooting)

## 📁 Project Structure

```
Springboard04_11/
├── backend/              # FastAPI Backend (Port 8000)
│   ├── core/            # Core business logic
│   ├── db/              # Database layer
│   ├── services/        # AI Services (sentiment, recommendations)
│   ├── tests/           # Test files
│   ├── main.py          # Main API application
│   ├── requirements.txt # Python dependencies
│   └── README.md        # 📖 Backend setup guide
│
├── agent/                # LiveKit Voice Agent
│   ├── app.py           # Main agent application
│   ├── requirements.txt # Python dependencies
│   └── README.md        # 📖 Agent setup guide
│
├── agent-starter-react/  # Next.js Frontend (Port 3000)
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── package.json     # Node dependencies
│   └── README.md        # 📖 Frontend setup guide
│
└── README.md            # 📖 Main project documentation
```

> 📚 **Each component has its own detailed README with setup instructions, API documentation, and troubleshooting guides.**


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
- Review component-specific troubleshooting in individual READMEs
- Review logs in the `logs/` directory
- Open an issue on GitHub
- Contact: meegadavamsi76@gmail.com

---

## 🎯 Getting Started

**New to the project?** Follow these steps:

1. **📖 Read the Overview** - Understand the architecture and features above
2. **⚙️ Setup Environment** - Configure API keys using the [Environment Setup](#environment-setup) guide
3. **🚀 Quick Start** - Run the automated setup script or follow manual setup
4. **📚 Component Docs** - Dive into individual component READMEs for detailed information:
   - [Backend README](./backend/README.md) - API endpoints, database setup, testing
   - [Agent README](./agent/README.md) - Voice AI configuration, model selection
   - [Frontend README](./agent-starter-react/README.md) - UI components, pages, deployment
5. **🌐 Access Application** - Visit http://localhost:3000 and start using the AI assistant!

**Happy coding! 🚀**
