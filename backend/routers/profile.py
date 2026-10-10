"""
routers/profile.py — Student view of academic profile.
Students are strictly read-only; academic profiles must be created and edited by the Placement Admin.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_student_user
from models import User, AcademicProfile
from schemas import ProfileOut

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    profile = db.query(AcademicProfile).filter(AcademicProfile.user_id == student.id).first()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Official academic profile has not been configured yet. Please contact your placement administrator to verify and enter your academic details.",
        )
    return profile


@router.put("")
def student_cannot_edit_profile(
    student: User = Depends(get_student_user),
):
    """Direct modification by students is blocked for academic integrity."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Academic records are locked for students. Only the Placement Cell Administrator can create or update academic profiles.",
    )
