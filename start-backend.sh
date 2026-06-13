#!/bin/bash

echo "========================================"
echo "   ROAD-WATCH Backend Startup Script"
echo "========================================"
echo ""

cd backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo ""
echo "========================================"
echo "Starting ROAD-WATCH API Server..."
echo "API Docs: http://localhost:8000/docs"
echo "========================================"
echo ""

python main.py
