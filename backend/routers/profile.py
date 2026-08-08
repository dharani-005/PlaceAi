"""
routers/profile.py — Academic profile create / read / update.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_student_user
from models import User, AcademicProfile, MatchResult
from schemas import ProfileUpsertRequest, ProfileOut

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    profile = db.query(AcademicProfile).filter(AcademicProfile.user_id == student.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Academic profile not found. Please create one.")
    return profile


@router.put("", response_model=ProfileOut)
def upsert_profile(
    payload: ProfileUpsertRequest,
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    profile = db.query(AcademicProfile).filter(AcademicProfile.user_id == student.id).first()
    if profile:
        for field, value in payload.model_dump().items():
            setattr(profile, field, value)
    else:
        profile = AcademicProfile(user_id=student.id, **payload.model_dump())
        db.add(profile)
    
    # Invalidate cached match results for this student
    db.query(MatchResult).filter(MatchResult.user_id == student.id).delete()
    
    db.commit()
    db.refresh(profile)
    return profile
