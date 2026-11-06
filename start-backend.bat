@echo off
echo ============================================
echo   SupportDeskAI Backend - Local Startup
echo ============================================
echo.
echo Starting FastAPI backend on http://localhost:8000
echo Swagger docs: http://localhost:8000/api/v1/docs
echo.
echo Press CTRL+C to stop the server.
echo.
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

