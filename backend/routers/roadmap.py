"""
routers/roadmap.py — Generate, view, and track progress on learning roadmaps.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_student_user
from models import User, Roadmap, RoadmapProgress, Resume, ItemStatus
from schemas import RoadmapGenerateRequest, RoadmapProgressUpdate, RoadmapOut
from services.roadmap_gen import generate_roadmap

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


@router.get("", response_model=RoadmapOut)
def get_active_roadmap(
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == student.id, Roadmap.is_active == True)
        .first()
    )
    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap. Generate one first.")
    return roadmap


@router.post("/generate", response_model=RoadmapOut, status_code=201)
async def generate_new_roadmap(
    payload: RoadmapGenerateRequest,
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    # Get current skills from latest resume (if any)
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == student.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )
    current_skills = latest_resume.extracted_skills if latest_resume else []

    # Archive any existing active roadmap
    existing = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == student.id, Roadmap.is_active == True)
        .first()
    )
    if existing:
        existing.is_active = False
        db.commit()

    # Generate from AI
    try:
        items = await generate_roadmap(payload.target_role, current_skills)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {str(e)}")

    # Save to DB
    roadmap = Roadmap(
        user_id=student.id,
        target_role=payload.target_role,
        items=items,
        is_active=True,
    )
    db.add(roadmap)
    db.flush()

    # Initialise progress rows for each item
    for item in items:
        prog = RoadmapProgress(
            roadmap_id=roadmap.id,
            item_id=item["id"],
            status=ItemStatus.not_started,
        )
        db.add(prog)

    db.commit()
    db.refresh(roadmap)
    return roadmap


@router.put("/progress/{item_id}", status_code=200)
def update_progress(
    item_id: str,
    payload: RoadmapProgressUpdate,
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    # Validate status value
    try:
        new_status = ItemStatus(payload.status)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="status must be one of: not_started, in_progress, completed",
        )

    # Find active roadmap
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == student.id, Roadmap.is_active == True)
        .first()
    )
    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap found")

    # Find progress row
    progress = (
        db.query(RoadmapProgress)
        .filter(
            RoadmapProgress.roadmap_id == roadmap.id,
            RoadmapProgress.item_id == item_id,
        )
        .first()
    )
    if not progress:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found in active roadmap")

    progress.status = new_status
    db.commit()
    return {"item_id": item_id, "status": new_status.value}
