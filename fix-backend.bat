@echo off
echo Fixing Backend Dependencies and Restarting Services
echo ===================================================

cd /d "%~dp0"

echo Stopping any running processes...
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul
taskkill /f /im node.exe 2>nul

echo.
echo Reinstalling backend dependencies...
cd backend
if exist .venv (
    echo Removing old virtual environment...
    rmdir /s /q .venv
)

echo Creating new virtual environment...
python -m venv .venv

echo Installing requirements...
.venv\Scripts\pip install --upgrade pip
.venv\Scripts\pip install -r requirements.txt

echo.
echo Testing backend startup...
.venv\Scripts\python -c "import main; print('Backend imports successful!')"

echo.
echo Starting backend server...
start "Backend Server" cmd /k ".venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Testing backend health...
curl -s http://localhost:8000/health || echo Backend not responding yet

echo.
echo Backend fix completed!
echo - Backend should be running on http://localhost:8000
echo - Check the new terminal window for backend logs
echo - Test with: http://localhost:8000/health

pause
