#!/usr/bin/env bash
echo "==================================================="
echo "Starting AVEON AI Robotics Suite"
echo "Backend: FastAPI + OpenCV + AI Task Planner (Port 8000)"
echo "Frontend: React + Vite + Tailwind CSS (Port 5173)"
echo "==================================================="

# Start backend in background
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 2

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

echo "Application running!"
echo "Access Web Dashboard: http://localhost:5173"
echo "Backend API Docs:     http://localhost:8000/docs"
echo "==================================================="

wait
