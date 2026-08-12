"""
schemas.py — Pydantic v2 request/response schemas for all routers.
"""
from __future__ import annotations

import uuid
from datetime import datetime, date
from typing import Optional, List, Any

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    role: str = "student"  # "student" | "admin"
    admin_secret: Optional[str] = None  # Required when role == "admin"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    user_id: str


# ─── User ─────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Job Descriptions ─────────────────────────────────────────────────────────

class InterviewRound(BaseModel):
    round_number: int
    round_type: str  # e.g. "Technical", "HR", "Aptitude"
    description: Optional[str] = None


class JobCreateRequest(BaseModel):
    company_name: str
    role_title: str
    eligible_branches: List[str]
    batch_year: int
    cgpa_cutoff: Optional[float] = None
    backlog_allowed: int = 0
    ctc: Optional[str] = None
    interview_rounds: Optional[List[InterviewRound]] = []
    deadline: date
    requirements_text: str


class JobUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    eligible_branches: Optional[List[str]] = None
    batch_year: Optional[int] = None
    cgpa_cutoff: Optional[float] = None
    backlog_allowed: Optional[int] = None
    ctc: Optional[str] = None
    interview_rounds: Optional[List[InterviewRound]] = None
    deadline: Optional[date] = None
    requirements_text: Optional[str] = None
    is_active: Optional[bool] = None


class JobOut(BaseModel):
    id: uuid.UUID
    company_name: str
    role_title: str
    eligible_branches: List[str]
    batch_year: int
    cgpa_cutoff: Optional[float]
    backlog_allowed: int
    ctc: Optional[str]
    interview_rounds: Optional[List[Any]]
    deadline: date
    requirements_text: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Resumes ──────────────────────────────────────────────────────────────────

class ATSBreakdown(BaseModel):
    contact_info: float
    standard_sections: float
    parsability: float
    quantified_achievements: float
    action_verbs: float
    appropriate_length: float
    keyword_density: float
    spelling: float


class ResumeOut(BaseModel):
    id: uuid.UUID
    file_name: str
    ats_score: Optional[float]
    ats_breakdown: Optional[Any]
    extracted_skills: List[str]
    extracted_projects: Optional[Any]
    uploaded_at: datetime

    model_config = {"from_attributes": True}


# ─── Academic Profile ─────────────────────────────────────────────────────────

class ProfileUpsertRequest(BaseModel):
    cgpa: float = Field(ge=0.0, le=10.0)
    backlog_count: int = Field(ge=0)
    branch: str
    batch_year: int

    @field_validator("batch_year")
    @classmethod
    def valid_year(cls, v: int) -> int:
        if v < 2000 or v > 2100:
            raise ValueError("batch_year must be a valid year")
        return v


class ProfileOut(BaseModel):
    id: uuid.UUID
    cgpa: float
    backlog_count: int
    branch: str
    batch_year: int
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Roadmap ──────────────────────────────────────────────────────────────────

class RoadmapItem(BaseModel):
    id: str
    title: str
    description: str
    order: int
    category: Optional[str] = None


class RoadmapGenerateRequest(BaseModel):
    target_role: str


class RoadmapProgressUpdate(BaseModel):
    status: str  # "not_started" | "in_progress" | "completed"


class RoadmapProgressOut(BaseModel):
    item_id: str
    status: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoadmapOut(BaseModel):
    id: uuid.UUID
    target_role: str
    items: List[Any]
    is_active: bool
    generated_at: datetime
    progress: List[RoadmapProgressOut]

    model_config = {"from_attributes": True}


# ─── Match ────────────────────────────────────────────────────────────────────

class IneligibilityReason(BaseModel):
    field: str
    reason: str


class MatchResultOut(BaseModel):
    job_id: uuid.UUID
    resume_id: uuid.UUID
    is_eligible: bool
    ineligibility_reasons: Optional[List[Any]]
    match_score: Optional[float]
    matched_skills: Optional[List[str]]
    missing_skills: Optional[List[str]]
    computed_at: datetime

    model_config = {"from_attributes": True}


# ─── Chatbot ──────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    mode: str = "qa"  # "qa" | "mock_interview"


class ChatResponse(BaseModel):
    reply: str
    mode: str


# ─── Admin: Candidate ranking ─────────────────────────────────────────────────

class CandidateRankEntry(BaseModel):
    rank: int
    user_id: uuid.UUID
    full_name: str
    branch: str
    cgpa: float
    match_score: float
    matched_skills: List[str]
    resume_id: uuid.UUID
