@echo off
echo MongoDB Connection Test
echo ======================

cd /d "%~dp0"

echo Checking if virtual environment exists...
if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv .venv
    echo Installing requirements...
    .venv\Scripts\pip install -r requirements.txt
)

echo Activating virtual environment and running test...
.venv\Scripts\python test_mongodb.py

echo.
echo Test completed. Press any key to exit...
pause > nul
