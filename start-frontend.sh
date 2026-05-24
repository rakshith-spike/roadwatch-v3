#!/bin/bash

echo "========================================"
echo "  ROAD-WATCH Frontend Startup Script"
echo "========================================"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "========================================"
echo "Starting ROAD-WATCH Frontend..."
echo "Frontend: http://localhost:5173"
echo "========================================"
echo ""

npm run dev
