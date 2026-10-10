"""
routers/chatbot.py — Chatbot endpoints with full conversation history persistence.
Supports "qa" and "mock_interview" modes with contextual candidate profiling.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_student_user
from models import User, Resume, Roadmap, RoadmapProgress, ChatMessage as DBChatMessage
from schemas import ChatRequest, ChatResponse, ChatMessageOut
from services.chatbot_service import chat

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


def _get_student_context(student: User, db: Session):
    """Gather skills, target role, and roadmap progress for context injection."""
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == student.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )
    skills = latest_resume.extracted_skills if latest_resume else []

    active_roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == student.id, Roadmap.is_active == True)
        .first()
    )
    target_role: Optional[str] = active_roadmap.target_role if active_roadmap else None

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


@router.get("/history", response_model=List[ChatMessageOut])
def get_chat_history(
    mode: Optional[str] = Query(None, description="qa or mock_interview"),
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    """Fetch stored conversation history for the authenticated student."""
    query = db.query(DBChatMessage).filter(DBChatMessage.user_id == student.id)
    if mode:
        query = query.filter(DBChatMessage.mode == mode)
    return query.order_by(DBChatMessage.created_at.asc()).all()


@router.delete("/history", status_code=204)
def clear_chat_history(
    mode: Optional[str] = Query(None, description="qa or mock_interview"),
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    """Clear conversation history for the student."""
    query = db.query(DBChatMessage).filter(DBChatMessage.user_id == student.id)
    if mode:
        query = query.filter(DBChatMessage.mode == mode)
    query.delete(synchronize_session=False)
    db.commit()


@router.post("/chat", response_model=ChatResponse)
async def chatbot_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    if payload.mode not in ("qa", "mock_interview"):
        raise HTTPException(status_code=400, detail="mode must be 'qa' or 'mock_interview'")

    skills, target_role, roadmap_progress = _get_student_context(student, db)

    # Save incoming user message if present
    if payload.messages and payload.messages[-1].role == "user":
        last_user_msg = payload.messages[-1]
        user_record = DBChatMessage(
            user_id=student.id,
            mode=payload.mode,
            role="user",
            content=last_user_msg.content,
        )
        db.add(user_record)
        db.commit()

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

    # Save assistant response to DB
    assistant_record = DBChatMessage(
        user_id=student.id,
        mode=payload.mode,
        role="assistant",
        content=reply,
    )
    db.add(assistant_record)
    db.commit()

    return ChatResponse(reply=reply, mode=payload.mode)
