@echo off
echo ===================================================
echo Starting AVEON AI Robotics Suite
echo Backend: FastAPI + OpenCV + AI Task Planner (Port 8000)
echo Frontend: React + Vite + Tailwind CSS (Port 5173)
echo ===================================================

start "AVEON Backend" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "AVEON Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application running!
echo Access Web Dashboard: http://localhost:5173
echo Backend API Docs:     http://localhost:8000/docs
echo ===================================================
