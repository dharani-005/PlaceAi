@echo off
echo ============================================
echo  PlaceAI — Frontend Setup + Start
echo ============================================
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)

echo Installing npm packages...
call npm install
if errorlevel 1 ( echo ERROR: npm install failed & pause & exit /b 1 )

echo.
echo Starting frontend on http://localhost:5173 ...
call npm run dev
