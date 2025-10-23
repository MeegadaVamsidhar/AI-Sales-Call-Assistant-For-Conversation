#!/usr/bin/env bash
set -euo pipefail

echo "🚀 AI Sales Call Assistant - Starting All Services"
echo "=================================================="

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

# Detect if running on Windows (Git Bash)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  PYTHON_CMD="python"
  VENV_ACTIVATE="Scripts/activate"
  VENV_PYTHON="Scripts/python"
  VENV_UVICORN="Scripts/uvicorn"
  echo "🖥️  Detected Windows environment"
else
  PYTHON_CMD="python3"
  VENV_ACTIVATE="bin/activate"
  VENV_PYTHON="bin/python"
  VENV_UVICORN="bin/uvicorn"
  echo "🐧 Detected Unix-like environment"
fi

# Function to check if a port is in use
check_port() {
  local port=$1
  if command -v netstat >/dev/null 2>&1; then
    if netstat -an | grep -q ":$port "; then
      return 0  # Port is in use
    fi
  elif command -v lsof >/dev/null 2>&1; then
    if lsof -i ":$port" >/dev/null 2>&1; then
      return 0  # Port is in use
    fi
  fi
  return 1  # Port is free
}

# Function to wait for service to be ready
wait_for_service() {
  local url=$1
  local service_name=$2
  local max_attempts=30
  local attempt=1
  
  echo "⏳ Waiting for $service_name to be ready..."
  while [ $attempt -le $max_attempts ]; do
    if curl -s "$url" >/dev/null 2>&1; then
      echo "✅ $service_name is ready!"
      return 0
    fi
    # Only show progress every 5 attempts to reduce verbosity
    if [ $((attempt % 5)) -eq 0 ]; then
      echo "   Still waiting... ($attempt/$max_attempts)"
    fi
    sleep 2
    ((attempt++))
  done
  echo "❌ $service_name failed to start within timeout"
  return 1
}

# Check if ports are available
echo ""
echo "🔍 Checking port availability..."
if check_port 8000; then
  echo "⚠️  Port 8000 is already in use. Please stop the existing service or change the port."
  exit 1
fi
if check_port 3000; then
  echo "⚠️  Port 3000 is already in use. Please stop the existing service or change the port."
  exit 1
fi
echo "✅ Ports 8000 and 3000 are available"

# Backend Setup
echo ""
echo "🔧 Setting up Backend (FastAPI)..."
if [ ! -f "$ROOT_DIR/backend/.venv/$VENV_PYTHON" ]; then
  echo "   Creating virtual environment and installing requirements..."
  cd "$ROOT_DIR/backend"
  $PYTHON_CMD -m venv .venv
  source ".venv/$VENV_ACTIVATE"
  pip install -r requirements.txt
  cd "$ROOT_DIR"
else
  echo "   Virtual environment exists, checking dependencies..."
  cd "$ROOT_DIR/backend"
  source ".venv/$VENV_ACTIVATE"
  # Check if pandas is installed, if not reinstall all requirements
  if ! python -c "import pandas" 2>/dev/null; then
    echo "   Missing dependencies detected, installing core packages..."
    pip install --no-cache-dir fastapi uvicorn python-dotenv pandas || {
      echo "   Warning: Some packages failed to install, continuing..."
    }
  else
    echo "   Dependencies are up to date"
  fi
  cd "$ROOT_DIR"
fi

# Check if .env file exists
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  echo "⚠️  Backend .env file not found. Creating default configuration..."
  cat > "$ROOT_DIR/backend/.env" << EOF
# MongoDB Configuration
DATABASE_URL=mongodb://localhost:27017
DB_NAME=agent_starter_db

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
ADMIN_EMAIL=meegadavamsi76@gmail.com

# LiveKit Configuration
LIVEKIT_API_KEY=YOUR_LIVEKIT_API_KEY
LIVEKIT_API_SECRET=YOUR_LIVEKIT_API_SECRET
EOF
  echo "   Created .env file with default values. Please update SMTP credentials if needed."
fi

echo "🚀 Starting FastAPI Backend on port 8000..."
cd "$ROOT_DIR/backend"
nohup bash -c "source .venv/$VENV_ACTIVATE && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$ROOT_DIR"

# Wait for backend to be ready
if wait_for_service "http://localhost:8000/health" "Backend API"; then
  echo "📊 Backend API Documentation: http://localhost:8000/docs"
  echo "🔧 Admin Registration: http://localhost:8000/api/auth/admin/register"
else
  echo "❌ Backend failed to start. Check logs: tail -f $LOG_DIR/backend.log"
  exit 1
fi

# Frontend Setup
echo ""
echo "🔧 Setting up Frontend (Next.js)..."
echo "   Installing dependencies with pnpm..."
(cd "$ROOT_DIR/agent-starter-react" && npx -y pnpm@9.12.2 install --frozen-lockfile > "$LOG_DIR/frontend-install.log" 2>&1)

# Check if frontend .env.local exists and has BACKEND_URL
if [ ! -f "$ROOT_DIR/agent-starter-react/.env.local" ] || ! grep -q "BACKEND_URL" "$ROOT_DIR/agent-starter-react/.env.local"; then
  echo "   Ensuring BACKEND_URL is set in .env.local..."
  echo "BACKEND_URL=http://localhost:8000" >> "$ROOT_DIR/agent-starter-react/.env.local"
fi

echo "🚀 Starting Next.js Frontend on port 3000..."
nohup bash -c "cd '$ROOT_DIR/agent-starter-react' && NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npx -y pnpm@9.12.2 dev" > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
if wait_for_service "http://localhost:3000" "Frontend"; then
  echo "🌐 Frontend Application: http://localhost:3000"
  echo "👤 Admin Registration: http://localhost:3000/auth/admin-signup"
else
  echo "❌ Frontend failed to start. Check logs: tail -f $LOG_DIR/frontend.log"
fi

# Agent Setup
echo ""
echo "🔧 Setting up LiveKit Agent..."
if [ ! -f "$ROOT_DIR/agent/venv/$VENV_PYTHON" ]; then
  echo "   Creating virtual environment and installing requirements..."
  cd "$ROOT_DIR/agent"
  $PYTHON_CMD -m venv venv
  source "venv/$VENV_ACTIVATE"
  pip install -r requirements.txt
  cd "$ROOT_DIR"
else
  echo "   Virtual environment already exists"
fi

echo "🚀 Starting LiveKit Agent..."
cd "$ROOT_DIR/agent"
nohup bash -c "source venv/$VENV_ACTIVATE && python app.py dev" > "$LOG_DIR/agent.log" 2>&1 &
AGENT_PID=$!
cd "$ROOT_DIR"

echo ""
echo "🎉 AI Sales Call Assistant - All Services Started Successfully!"
echo "=============================================================="
echo ""
echo "📊 Service Status:"
echo "   ✅ Backend API:     http://localhost:8000"
echo "   ✅ Frontend App:    http://localhost:3000"
echo "   ✅ LiveKit Agent:   Running in background"
echo ""
echo "🔗 Important URLs:"
echo "   🌐 Main Application:        http://localhost:3000"
echo "   👤 Admin Registration:      http://localhost:3000/auth/admin-signup"
echo "   🔐 Admin Login:             http://localhost:3000/auth/login"
echo "   📖 API Documentation:       http://localhost:8000/docs"
echo "   ❤️  Health Check:           http://localhost:8000/health"
echo ""
echo "📋 Admin Registration Workflow:"
echo "   1. Register at: http://localhost:3000/auth/admin-signup"
echo "   2. Verification email sent to: meegadavamsi76@gmail.com"
echo "   3. Click approval link in email to assign Employee ID"
echo "   4. Admin receives email with Employee ID and login instructions"
echo "   5. Login at: http://localhost:3000/auth/login"
echo ""
echo "📁 Log Files:"
echo "   Backend:   $LOG_DIR/backend.log"
echo "   Frontend:  $LOG_DIR/frontend.log"
echo "   Agent:     $LOG_DIR/agent.log"
echo ""
echo "🔧 Useful Commands:"
echo "   Monitor logs:    tail -f $LOG_DIR/backend.log $LOG_DIR/frontend.log $LOG_DIR/agent.log"
echo "   Stop services:   pkill -f 'uvicorn\\|pnpm\\|python.*app.py'"
echo "   Test backend:    curl http://localhost:8000/health"
echo ""
echo "⚠️  Notes:"
echo "   - MongoDB connection: Check backend logs if admin registration fails"
echo "   - Email configuration: Update backend/.env with SMTP credentials"
echo "   - LiveKit setup: Configure LIVEKIT_API_KEY and LIVEKIT_API_SECRET"
echo ""
echo "🚀 Ready to use! Visit http://localhost:3000 to get started."


