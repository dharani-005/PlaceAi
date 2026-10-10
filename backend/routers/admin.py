"""
routers/admin.py — Admin-only endpoints for managing user accounts and student academic records.
"""
import uuid
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_admin_user
from models import User, UserRole, JobDescription, AcademicProfile, MatchResult
from schemas import (
    UserOut, UserAdminUpdateRequest, AdminSelfUpdateRequest,
    ProfileUpsertRequest, ProfileOut, TokenResponse, AdminCreateRequest,
)
from auth import hash_password, create_access_token

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/admins", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_admin(
    payload: AdminCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Admin endpoint to create a new administrator account."""
    target_email = payload.email.strip().lower()
    existing = db.query(User).filter(func.lower(User.email) == target_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    new_admin = User(
        email=target_email,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password.strip()),
        role=UserRole.admin,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin


@router.get("/users", response_model=List[UserOut])
def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """List all registered users with optional search and role filtering."""
    query = db.query(User)

    if role:
        try:
            role_enum = UserRole(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role filter")

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(search_term)) | (User.full_name.ilike(search_term))
        )

    return query.order_by(User.created_at.desc()).all()


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: uuid.UUID,
    payload: UserAdminUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Update a user's details, including role change or resetting password."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target_email = payload.email.strip().lower()

    # Check duplicate email if it is being changed
    if target_email != user.email.lower():
        existing = db.query(User).filter(
            func.lower(User.email) == target_email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered to another account",
            )

    # Protect self-demotion
    if user.id == admin.id and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot demote your own account from administrator role.",
        )

    # Update basic fields
    user.email = target_email
    user.full_name = payload.full_name.strip()

    try:
        user.role = UserRole(payload.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'student' or 'admin'",
        )

    # Update password if provided
    if payload.password and payload.password.strip():
        user.hashed_password = hash_password(payload.password.strip())

    db.commit()
    db.refresh(user)
    return user


@router.put("/me", response_model=TokenResponse)
def update_admin_self(
    payload: AdminSelfUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Directly update current admin's email, name, and/or password with instant token refresh."""
    target_email = payload.email.strip().lower()

    if target_email != admin.email.lower():
        existing = db.query(User).filter(
            func.lower(User.email) == target_email,
            User.id != admin.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered to another account",
            )

    admin.email = target_email
    admin.full_name = payload.full_name.strip()

    if payload.password and payload.password.strip():
        admin.hashed_password = hash_password(payload.password.strip())

    db.commit()
    db.refresh(admin)

    # Generate fresh token
    new_token = create_access_token({"sub": str(admin.id), "role": admin.role.value})
    return TokenResponse(
        access_token=new_token,
        role=admin.role.value,
        full_name=admin.full_name,
        user_id=str(admin.id),
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Delete a user account. Block self-deletion and deletion of admins with posted jobs."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Prevent deleting admin who has active jobs
    if user.role == UserRole.admin:
        job_count = db.query(JobDescription).filter(JobDescription.created_by == user_id).count()
        if job_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete admin account. This user has posted {job_count} active job drive(s). Reassign or delete those drives first.",
            )

    db.delete(user)
    db.commit()
    return


# ─── Student Academic Profile Management (Admin only) ─────────────────────────

@router.get("/users/{user_id}/profile", response_model=Optional[ProfileOut])
def get_student_profile_by_admin(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Fetch official academic profile for any student."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(AcademicProfile).filter(AcademicProfile.user_id == user_id).first()
    return profile


@router.put("/users/{user_id}/profile", response_model=ProfileOut)
def update_student_profile_by_admin(
    user_id: uuid.UUID,
    payload: ProfileUpsertRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Admin endpoint to create or update a student's official academic profile."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(AcademicProfile).filter(AcademicProfile.user_id == user_id).first()
    if profile:
        for field, value in payload.model_dump().items():
            setattr(profile, field, value)
        profile.updated_at = datetime.now(timezone.utc)
    else:
        profile = AcademicProfile(user_id=user_id, **payload.model_dump())
        db.add(profile)

    # Invalidate stale match results for this student so eligibility updates immediately
    db.query(MatchResult).filter(MatchResult.user_id == user_id).delete()

    db.commit()
    db.refresh(profile)
    return profile
