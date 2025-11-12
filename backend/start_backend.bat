@echo off
echo ========================================
echo   Sentiment Aura Backend Launcher
echo ========================================
echo.
echo Activating virtual environment...
call venv\Scripts\activate
echo.
echo Starting backend server...
echo.
python start_server.py