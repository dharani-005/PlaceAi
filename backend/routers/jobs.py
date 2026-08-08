"""
routers/jobs.py — Job Description CRUD (admin) + listing (all).
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_admin_user
from models import User, JobDescription, MatchResult, AcademicProfile
from schemas import JobCreateRequest, JobUpdateRequest, JobOut, CandidateRankEntry

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=List[JobOut])
def list_jobs(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(JobDescription).filter(JobDescription.is_active == True).order_by(JobDescription.deadline).all()


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("", response_model=JobOut, status_code=201)
def create_job(
    payload: JobCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    job = JobDescription(**payload.model_dump(), created_by=admin.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: UUID,
    payload: JobUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(job, field, value)
    
    # Invalidate cached match results for this job since details/criteria changed
    db.query(MatchResult).filter(MatchResult.job_id == job_id).delete()
    
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()


@router.get("/{job_id}/candidates", response_model=List[CandidateRankEntry])
def get_candidates(
    job_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """
    Return ranked list of eligible students for a JD, sorted by match score DESC.
    """
    results = (
        db.query(MatchResult)
        .filter(
            MatchResult.job_id == job_id,
            MatchResult.is_eligible == True,
            MatchResult.match_score.isnot(None),
        )
        .order_by(MatchResult.match_score.desc())
        .all()
    )

    ranked = []
    for rank, mr in enumerate(results, start=1):
        profile = db.query(AcademicProfile).filter(AcademicProfile.user_id == mr.user_id).first()
        ranked.append(
            CandidateRankEntry(
                rank=rank,
                user_id=mr.user_id,
                full_name=mr.user.full_name,
                branch=profile.branch if profile else "N/A",
                cgpa=profile.cgpa if profile else 0.0,
                match_score=mr.match_score or 0.0,
                matched_skills=mr.matched_skills or [],
                resume_id=mr.resume_id,
            )
        )
    return ranked
