@echo off
title GeoIntelligence AI - Launching System
echo ========================================================
echo   GeoIntelligence AI - Earth Surface Change Detection
echo ========================================================
echo.

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "GeoIntelligence Backend" cmd /k ".\.venv\Scripts\python.exe backend\run.py"

echo [2/2] Launching React Vite Frontend on http://127.0.0.1:5173 ...
start "GeoIntelligence Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   System running!
echo   - Web UI:      http://127.0.0.1:5173
echo   - Backend API: http://127.0.0.1:8000/docs
echo ========================================================
pause

