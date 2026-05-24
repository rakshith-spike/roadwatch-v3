@echo off
echo ========================================
echo    ROAD-WATCH Backend Startup Script
echo ========================================
echo.

cd backend

:: Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate venv
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

:: Create .env if not exists
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
)

echo.
echo ========================================
echo Starting ROAD-WATCH API Server...
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.

python main.py
