# 🎤 LiveKit Voice AI Agent

Real-time voice assistant powered by LiveKit, Deepgram STT/TTS, and Google Gemini LLM for intelligent book sales conversations.

## 📁 Project Structure

```
agent/
├── app.py              # Main agent application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
└── venv/              # Virtual environment
```

## 🚀 Quick Start

### 1. Setup Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

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
# LiveKit Cloud
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Deepgram (Speech-to-Text & Text-to-Speech)
DEEPGRAM_API_KEY=your_deepgram_api_key

# Google Gemini (LLM)
GOOGLE_API_KEY=your_google_api_key

# Optional Model Overrides
DEEPGRAM_STT_MODEL=nova-3
DEEPGRAM_TTS_MODEL=aura-asteria-en
GOOGLE_LLM_MODEL=gemini-2.0-flash-001

# Admin Email
ADMIN_EMAIL=your_admin_email@gmail.com
```

### 3. Start Agent

```bash
# Development mode
python app.py dev

# Production mode
python app.py start
```

## 🔑 API Keys Required

### 1. LiveKit
- Sign up at [livekit.io](https://livekit.io/)
- Navigate to Dashboard → Settings → Keys
- Copy URL, API Key, and API Secret

### 2. Deepgram
- Sign up at [deepgram.com](https://deepgram.com/)
- Go to API Keys section
- Create New Key

### 3. Google Gemini
- Visit [ai.google.dev](https://ai.google.dev/)
- Click "Get API Key"
- Create new API key

## 🎯 Features

- **Real-time Voice Processing** - Natural conversation with customers
- **Speech-to-Text** - Powered by Deepgram Nova-3 model
- **Text-to-Speech** - Natural voice synthesis with Deepgram Aura
- **AI Conversations** - Context-aware responses using Google Gemini
- **Order Processing** - Intelligent extraction of customer details
- **Personalized Recommendations** - AI-driven book suggestions

## 🛠️ Troubleshooting

### Agent Won't Start
- Verify all API keys in `.env`
- Check virtual environment is activated
- Ensure all dependencies are installed: `pip install -r requirements.txt`

### Connection Issues
- Verify LiveKit URL format: `wss://your-domain.livekit.cloud`
- Check API keys are correct (no extra spaces)
- Ensure firewall allows WebSocket connections

### Voice Quality Issues
- Try different Deepgram models (nova-2, nova-3)
- Check internet connection stability
- Verify microphone permissions

## 📊 Available Models

### Deepgram STT Models
- `nova-3` - Latest, most accurate (recommended)
- `nova-2` - Fast and accurate
- `base` - Standard model

### Deepgram TTS Voices
- `aura-asteria-en` - Professional female voice (recommended)
- `aura-luna-en` - Warm female voice
- `aura-stella-en` - Friendly female voice
- `aura-athena-en` - Clear female voice
- `aura-hera-en` - Authoritative female voice
- `aura-orion-en` - Professional male voice
- `aura-arcas-en` - Friendly male voice
- `aura-perseus-en` - Clear male voice
- `aura-angus-en` - Warm male voice
- `aura-orpheus-en` - Expressive male voice
- `aura-helios-en` - Energetic male voice
- `aura-zeus-en` - Authoritative male voice

### Google Gemini Models
- `gemini-2.0-flash-001` - Latest, fastest (recommended)
- `gemini-1.5-pro` - Most capable
- `gemini-1.5-flash` - Fast and efficient

## 🔒 Security Notes

- Never commit `.env` files
- Keep API keys secure and rotate regularly
- Use different keys for development and production
- Monitor API usage to avoid unexpected charges
