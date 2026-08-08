"""
routers/chatbot.py — Chatbot endpoint (QA + mock interview modes).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from dependencies import get_student_user
from models import User, Resume, Roadmap, RoadmapProgress
from schemas import ChatRequest, ChatResponse
from services.chatbot_service import chat

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


def _get_student_context(student: User, db: Session):
    """Gather skills, target role, and roadmap progress for context injection."""
    # Latest resume skills
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == student.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )
    skills = latest_resume.extracted_skills if latest_resume else []

    # Active roadmap
    active_roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == student.id, Roadmap.is_active == True)
        .first()
    )
    target_role: Optional[str] = active_roadmap.target_role if active_roadmap else None

    # Progress
    roadmap_progress = []
    if active_roadmap:
        progress_rows = (
            db.query(RoadmapProgress)
            .filter(RoadmapProgress.roadmap_id == active_roadmap.id)
            .all()
        )
        roadmap_progress = [
            {"item_id": p.item_id, "status": p.status.value}
            for p in progress_rows
        ]

    return skills, target_role, roadmap_progress


@router.post("/chat", response_model=ChatResponse)
async def chatbot_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    if payload.mode not in ("qa", "mock_interview"):
        raise HTTPException(status_code=400, detail="mode must be 'qa' or 'mock_interview'")

    skills, target_role, roadmap_progress = _get_student_context(student, db)

    try:
        reply = await chat(
            messages=[m.model_dump() for m in payload.messages],
            mode=payload.mode,
            skills=skills,
            target_role=target_role,
            roadmap_progress=roadmap_progress,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    return ChatResponse(reply=reply, mode=payload.mode)
