@echo off
echo ========================================
echo   ROAD-WATCH Frontend Startup Script
echo ========================================
echo.

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo ========================================
echo Starting ROAD-WATCH Frontend...
echo Frontend: http://localhost:5173
echo ========================================
echo.

npm run dev
