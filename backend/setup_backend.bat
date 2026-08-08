@echo off
echo ============================================
echo  PlaceAI - Backend Setup
echo  Python 3.13 compatible
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Creating Python virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.13+ from https://python.org
    pause & exit /b 1
)

echo [2/3] Installing Python dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo ERROR: pip install failed. See error above.
    pause & exit /b 1
)

echo [3/3] Running seed script (creates tables + demo accounts)...
python seed.py

echo.
echo ============================================
echo  Backend setup complete!
echo.
echo  IMPORTANT: Edit .env with your credentials:
echo    - DATABASE_URL  (your PostgreSQL password)
echo    - NEXUS_API_BASE_URL and NEXUS_API_KEY
echo.
echo  Then run: start_backend.bat
echo ============================================
pause
