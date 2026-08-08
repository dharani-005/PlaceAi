"""
routers/match.py — Eligibility check + semantic skill match for a given JD.
Results are cached in match_results table (per student, per job, per resume).
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_student_user
from models import User, JobDescription, AcademicProfile, Resume, MatchResult
from schemas import MatchResultOut
from services.matcher import check_eligibility, compute_skill_match

router = APIRouter(prefix="/api/match", tags=["match"])


@router.get("/{job_id}", response_model=MatchResultOut)
def get_match(
    job_id: UUID,
    db: Session = Depends(get_db),
    student: User = Depends(get_student_user),
):
    # Fetch JD
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch latest resume
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == student.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )
    if not latest_resume:
        raise HTTPException(
            status_code=400,
            detail="Please upload a resume before checking your match.",
        )

    # Return cached result if resume hasn't changed
    cached = (
        db.query(MatchResult)
        .filter(
            MatchResult.user_id == student.id,
            MatchResult.job_id == job_id,
            MatchResult.resume_id == latest_resume.id,
        )
        .first()
    )
    if cached:
        return cached

    # Fetch academic profile
    profile = db.query(AcademicProfile).filter(AcademicProfile.user_id == student.id).first()
    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Please fill in your academic profile before checking eligibility.",
        )

    profile_dict = {
        "branch": profile.branch,
        "batch_year": profile.batch_year,
        "cgpa": profile.cgpa,
        "backlog_count": profile.backlog_count,
    }
    job_dict = {
        "eligible_branches": job.eligible_branches,
        "batch_year": job.batch_year,
        "cgpa_cutoff": job.cgpa_cutoff,
        "backlog_allowed": job.backlog_allowed,
    }

    # Layer 1: Eligibility
    is_eligible, reasons = check_eligibility(profile_dict, job_dict)

    match_score = None
    matched_skills = []
    missing_skills = []

    # Layer 2: Skill match (only if eligible)
    if is_eligible:
        skill_result = compute_skill_match(
            resume_skills=latest_resume.extracted_skills or [],
            resume_text=latest_resume.extracted_text or "",
            jd_requirements=job.requirements_text,
        )
        match_score = skill_result["match_score"]
        matched_skills = skill_result["matched_skills"]
        missing_skills = skill_result["missing_skills"]

    # Cache result
    result = MatchResult(
        user_id=student.id,
        job_id=job_id,
        resume_id=latest_resume.id,
        is_eligible=is_eligible,
        ineligibility_reasons=reasons,
        match_score=match_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result
