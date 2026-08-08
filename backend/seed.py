"""
seed.py — Populate database with demo data for immediate testing.

Run with:  python seed.py

Creates:
  - 1 admin account   (admin@placement.edu  / admin123)
  - 1 student account (student@college.edu  / student123)
  - 3 sample job descriptions
"""
import sys
import os

# Ensure we can import from backend root
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
from database import SessionLocal, engine, Base
import models  # noqa: F401 — ensures all models are registered
from models import User, UserRole, JobDescription
from auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # ── Admin ──────────────────────────────────────────────────────────────────
    if not db.query(User).filter(User.email == "admin@placement.edu").first():
        admin = User(
            email="admin@placement.edu",
            hashed_password=hash_password("admin123"),
            full_name="Placement Cell Admin",
            role=UserRole.admin,
        )
        db.add(admin)
        db.flush()
        print("✅ Admin created: admin@placement.edu / admin123")
    else:
        admin = db.query(User).filter(User.email == "admin@placement.edu").first()
        print("⏭️  Admin already exists, skipping")

    # ── Student ────────────────────────────────────────────────────────────────
    if not db.query(User).filter(User.email == "student@college.edu").first():
        student = User(
            email="student@college.edu",
            hashed_password=hash_password("student123"),
            full_name="Rahul Sharma",
            role=UserRole.student,
        )
        db.add(student)
        print("✅ Student created: student@college.edu / student123")
    else:
        print("⏭️  Student already exists, skipping")

    db.flush()

    # ── Job Descriptions ───────────────────────────────────────────────────────
    jobs = [
        {
            "company_name": "Stradegi Solutions",
            "role_title": "Software Development Engineer (SDE)",
            "eligible_branches": ["CSE", "IT", "ECE"],
            "batch_year": 2025,
            "cgpa_cutoff": 6.5,
            "backlog_allowed": 0,
            "ctc": "6 LPA",
            "interview_rounds": [
                {"round_number": 1, "round_type": "Aptitude", "description": "Online aptitude test"},
                {"round_number": 2, "round_type": "Technical", "description": "DSA + CS fundamentals"},
                {"round_number": 3, "round_type": "HR", "description": "Culture fit and behavioural"},
            ],
            "deadline": date.today() + timedelta(days=14),
            "requirements_text": (
                "Looking for candidates with strong programming skills in Python or Java. "
                "Must have knowledge of data structures and algorithms. "
                "Experience with REST APIs and databases (SQL/NoSQL) preferred. "
                "Good communication skills required. "
                "Prior internship or project experience in web development is a plus."
            ),
        },
        {
            "company_name": "TCS iON",
            "role_title": "Prime — AI/ML Engineer",
            "eligible_branches": ["CSE", "IT", "EEE"],
            "batch_year": 2025,
            "cgpa_cutoff": 7.0,
            "backlog_allowed": 0,
            "ctc": "7 LPA",
            "interview_rounds": [
                {"round_number": 1, "round_type": "Aptitude", "description": "TCS NQT exam"},
                {"round_number": 2, "round_type": "Technical", "description": "ML fundamentals + Python coding"},
                {"round_number": 3, "round_type": "Technical", "description": "Case study presentation"},
                {"round_number": 4, "round_type": "HR", "description": "Final HR round"},
            ],
            "deadline": date.today() + timedelta(days=21),
            "requirements_text": (
                "Seeking candidates with strong foundation in machine learning, deep learning, and NLP. "
                "Proficiency in Python required. Experience with TensorFlow or PyTorch is highly desirable. "
                "Knowledge of pandas, numpy, scikit-learn. "
                "Familiarity with SQL databases. "
                "Strong analytical and problem-solving skills. "
                "Projects or publications in AI/ML domain are a significant plus."
            ),
        },
        {
            "company_name": "Infosys",
            "role_title": "Systems Engineer",
            "eligible_branches": ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"],
            "batch_year": 2025,
            "cgpa_cutoff": 6.0,
            "backlog_allowed": 1,
            "ctc": "3.6 LPA",
            "interview_rounds": [
                {"round_number": 1, "round_type": "Online Test", "description": "Reasoning + verbal + coding"},
                {"round_number": 2, "round_type": "HR", "description": "HR interview"},
            ],
            "deadline": date.today() + timedelta(days=30),
            "requirements_text": (
                "Open to all engineering branches. "
                "Basic programming knowledge in any language (C, C++, Java, Python). "
                "Good communication and teamwork skills. "
                "Willingness to work in any technology domain. "
                "Logical reasoning and problem-solving aptitude required."
            ),
        },
    ]

    existing_companies = {
        j.company_name for j in db.query(JobDescription.company_name).all()
    }

    for job_data in jobs:
        if job_data["company_name"] not in existing_companies:
            job = JobDescription(**job_data, created_by=admin.id)
            db.add(job)
            print(f"✅ Job created: {job_data['company_name']} — {job_data['role_title']}")
        else:
            print(f"⏭️  Job already exists: {job_data['company_name']}, skipping")

    db.commit()
    print("\n🎉 Seed complete! Ready to launch.")
    print("   Admin:   admin@placement.edu   / admin123")
    print("   Student: student@college.edu   / student123")

except Exception as e:
    db.rollback()
    print(f"❌ Seed failed: {e}")
    raise
finally:
    db.close()
