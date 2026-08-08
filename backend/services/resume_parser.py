"""
services/resume_parser.py
Extracts raw text and structured data (skills, projects) from PDF/DOCX resumes.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import List, Dict, Any, Tuple

# ─── Skill vocabulary ─────────────────────────────────────────────────────────
# A curated list used for skill extraction via token matching.
SKILL_VOCABULARY = {
    # Programming languages
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "rust",
    "kotlin", "swift", "r", "scala", "php", "ruby", "matlab", "bash", "sql",
    # Web
    "html", "css", "react", "angular", "vue", "next.js", "node.js", "express",
    "django", "flask", "fastapi", "spring", "asp.net", "rest api", "graphql",
    # Data / ML
    "machine learning", "deep learning", "nlp", "computer vision", "pandas",
    "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "opencv",
    "matplotlib", "seaborn", "tableau", "power bi",
    # Databases
    "postgresql", "mysql", "mongodb", "sqlite", "redis", "firebase",
    "cassandra", "elasticsearch",
    # Cloud / DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "jenkins", "git",
    "github", "gitlab", "linux", "ansible", "terraform",
    # Other
    "data structures", "algorithms", "oop", "system design", "agile", "scrum",
    "junit", "selenium", "postman", "excel", "word", "powerpoint",
}

# Section headings we recognise
PROJECT_HEADINGS = re.compile(
    r"^(projects?|academic projects?|personal projects?|notable projects?)",
    re.IGNORECASE | re.MULTILINE,
)
SECTION_HEADINGS = re.compile(
    r"^(education|experience|skills?|certifications?|achievements?|"
    r"extra.?curricular|activities|projects?|summary|objective|profile)",
    re.IGNORECASE | re.MULTILINE,
)


def _extract_text_from_pdf(file_path: str) -> str:
    import fitz  # PyMuPDF
    doc = fitz.open(file_path)
    return "\n".join(page.get_text() for page in doc)


def _extract_text_from_docx(file_path: str) -> str:
    from docx import Document
    doc = Document(file_path)
    return "\n".join(p.text for p in doc.paragraphs)


def extract_raw_text(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return _extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return _extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def extract_skills(text: str) -> List[str]:
    """
    Match skills from SKILL_VOCABULARY against the resume text (case-insensitive).
    Returns a deduplicated, sorted list.
    """
    text_lower = text.lower()
    found = set()
    for skill in SKILL_VOCABULARY:
        # Use word-boundary-aware matching for single-word skills
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found.add(skill)
    return sorted(found)


def extract_projects(text: str) -> List[Dict[str, str]]:
    """
    Heuristic extraction: find the Projects section and pull out bullet blocks.
    Returns a list of {title, description} dicts.
    """
    projects = []
    lines = text.split("\n")

    in_projects = False
    current_project: Dict[str, Any] = {}
    buffer: List[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Detect project section start
        if PROJECT_HEADINGS.match(stripped):
            in_projects = True
            continue

        # Detect any other major section heading → stop collecting
        if in_projects and SECTION_HEADINGS.match(stripped) and not PROJECT_HEADINGS.match(stripped):
            if buffer:
                projects.append({
                    "title": buffer[0] if buffer else "Project",
                    "description": " ".join(buffer[1:]),
                })
            in_projects = False
            buffer = []
            continue

        if in_projects:
            # Heuristic: lines that look like titles (short, Title Case, no period)
            if len(stripped) < 80 and not stripped.endswith(".") and stripped[0].isupper() and len(buffer) > 1:
                # Save previous project
                if buffer:
                    projects.append({
                        "title": buffer[0],
                        "description": " ".join(buffer[1:]),
                    })
                buffer = [stripped]
            else:
                buffer.append(stripped)

    # Flush last buffer
    if buffer and in_projects:
        projects.append({
            "title": buffer[0],
            "description": " ".join(buffer[1:]),
        })

    return projects[:10]  # Cap at 10 projects


def parse_resume(file_path: str) -> Dict[str, Any]:
    """
    Full pipeline: extract text → extract skills → extract projects.
    Returns dict ready for DB insertion.
    """
    raw_text = extract_raw_text(file_path)
    skills = extract_skills(raw_text)
    projects = extract_projects(raw_text)
    return {
        "extracted_text": raw_text,
        "extracted_skills": skills,
        "extracted_projects": projects,
    }
