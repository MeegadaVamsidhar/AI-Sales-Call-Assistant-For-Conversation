@echo off
echo Restarting Backend with Fixes
echo =============================

cd /d "%~dp0"

echo Stopping existing backend processes...
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul

echo.
echo Starting backend server...
cd backend
start "Backend Server" cmd /k ".venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Testing backend endpoints...
echo Testing health endpoint:
curl -s http://localhost:8000/health

echo.
echo Testing auth endpoint:
curl -s http://localhost:8000/api/auth/me

echo.
echo Backend restart completed!
echo - Backend running on: http://localhost:8000
echo - Health check: http://localhost:8000/health
echo - Auth check: http://localhost:8000/api/auth/me

pause
