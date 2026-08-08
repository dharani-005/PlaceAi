"""
models.py — All SQLAlchemy ORM models.
Tables: users, job_descriptions, resumes, academic_profiles,
        roadmaps, roadmap_progress, match_results
"""
import uuid
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Date,
    Text, ForeignKey, Enum as SAEnum, func,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
import enum

from database import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"


class ItemStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


# ─── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.student)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    academic_profile = relationship("AcademicProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    match_results = relationship("MatchResult", back_populates="user", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="created_by_user")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), nullable=False)
    role_title = Column(String(255), nullable=False)
    eligible_branches = Column(ARRAY(String), nullable=False, default=list)
    batch_year = Column(Integer, nullable=False)
    cgpa_cutoff = Column(Float, nullable=True)
    backlog_allowed = Column(Integer, nullable=False, default=0)
    ctc = Column(String(100), nullable=True)
    interview_rounds = Column(JSONB, nullable=True, default=list)
    deadline = Column(Date, nullable=False)
    requirements_text = Column(Text, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)

    created_by_user = relationship("User", back_populates="job_descriptions")
    match_results = relationship("MatchResult", back_populates="job", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    extracted_skills = Column(ARRAY(String), nullable=False, default=list)
    extracted_projects = Column(JSONB, nullable=True, default=list)
    extracted_text = Column(Text, nullable=True)
    ats_score = Column(Float, nullable=True)
    ats_breakdown = Column(JSONB, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="resumes")
    match_results = relationship("MatchResult", back_populates="resume")


class AcademicProfile(Base):
    __tablename__ = "academic_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    cgpa = Column(Float, nullable=False)
    backlog_count = Column(Integer, nullable=False, default=0)
    branch = Column(String(100), nullable=False)
    batch_year = Column(Integer, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="academic_profile")


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    target_role = Column(String(255), nullable=False)
    items = Column(JSONB, nullable=False, default=list)
    is_active = Column(Boolean, default=True)
    generated_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="roadmaps")
    progress = relationship("RoadmapProgress", back_populates="roadmap", cascade="all, delete-orphan")


class RoadmapProgress(Base):
    __tablename__ = "roadmap_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    roadmap_id = Column(UUID(as_uuid=True), ForeignKey("roadmaps.id"), nullable=False)
    item_id = Column(String(100), nullable=False)
    status = Column(SAEnum(ItemStatus), nullable=False, default=ItemStatus.not_started)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    roadmap = relationship("Roadmap", back_populates="progress")


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id"), nullable=False)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    is_eligible = Column(Boolean, nullable=False)
    ineligibility_reasons = Column(JSONB, nullable=True, default=list)
    match_score = Column(Float, nullable=True)
    matched_skills = Column(ARRAY(String), nullable=True, default=list)
    missing_skills = Column(ARRAY(String), nullable=True, default=list)
    computed_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="match_results")
    job = relationship("JobDescription", back_populates="match_results")
    resume = relationship("Resume", back_populates="match_results")
