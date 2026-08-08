@echo off
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo Starting PlaceAI backend on http://localhost:8000 ...
echo API docs: http://localhost:8000/docs
uvicorn main:app --reload --port 8000
