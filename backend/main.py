"""
main.py — FastAPI application entry point.
"""
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import get_settings
from database import engine, Base

# Import all models so SQLAlchemy sees them before create_all
import models  # noqa: F401

from routers import auth, jobs, resume, profile, roadmap, match, chatbot

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────
    # Create DB tables (idempotent — won't drop existing data)
    Base.metadata.create_all(bind=engine)

    # Ensure uploads directory exists
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

    print("✅ Database tables ready")
    print(f"✅ Upload directory: {settings.upload_dir}")

    yield

    # ── Shutdown ───────────────────────────────────────
    print("Shutting down...")


app = FastAPI(
    title="AI Resume Screening & Talent Matching System",
    description="Campus placement automation platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(resume.router)
app.include_router(profile.router)
app.include_router(roadmap.router)
app.include_router(match.router)
app.include_router(chatbot.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
