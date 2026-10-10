"""
routers/resume.py — Resume upload, history listing, and deletion.
"""
import os
import uuid
from pathlib import Path
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from dependencies import get_current_user, get_student_user
from models import User, Resume
from schemas import ResumeOut, ResumeAIImproveResponse
from services.resume_parser import parse_resume
from services.ats_scorer import compute_ats_score, generate_llm_resume_improvements

settings = get_settings()
router = APIRouter(prefix="/api/resume", tags=["resume"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}
MAX_BYTES = settings.max_file_size_mb * 1024 * 1024


@router.post("/upload", response_model=ResumeOut, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Upload a PDF or DOCX.",
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {settings.max_file_size_mb} MB.",
        )

    # Save file to disk
    upload_dir = Path(settings.upload_dir) / str(student.id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / unique_name
    with open(file_path, "wb") as f:
        f.write(contents)

    # Parse and score
    try:
        parsed = parse_resume(str(file_path))
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Could not parse resume: {str(e)}")

    ats_result = compute_ats_score(
        parsed["extracted_text"] or "",
        len(parsed["extracted_skills"]),
    )

    # Save to DB
    resume = Resume(
        user_id=student.id,
        file_path=str(file_path),
        file_name=file.filename,
        extracted_skills=parsed["extracted_skills"],
        extracted_projects=parsed["extracted_projects"],
        extracted_text=parsed["extracted_text"],
        ats_score=ats_result["total_score"],
        ats_breakdown=ats_result["breakdown"],
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/history", response_model=List[ResumeOut])
def get_resume_history(
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    return (
        db.query(Resume)
        .filter(Resume.user_id == student.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )


@router.delete("/{resume_id}", status_code=204)
def delete_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == student.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Delete file from disk
    try:
        Path(resume.file_path).unlink(missing_ok=True)
    except Exception:
        pass  # Don't fail if file is missing

    db.delete(resume)
    db.commit()


@router.post("/{resume_id}/ai-improve", response_model=ResumeAIImproveResponse)
async def get_resume_ai_improvements(
    resume_id: UUID,
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    """
    Leverages Nexus LLM to analyze the student's resume, recommending
    high-impact skills to add, STAR-format bullet rewrites, and ATS action plan.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == student.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        improvements = await generate_llm_resume_improvements(
            resume_text=resume.extracted_text or "",
            extracted_skills=resume.extracted_skills or [],
        )
        return improvements
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI improvement generation error: {str(e)}")
