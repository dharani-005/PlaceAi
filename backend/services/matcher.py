"""
services/matcher.py
Semantic skill matching using sentence-transformers (all-MiniLM-L6-v2).
Loads the model once at startup and keeps it in memory.
"""
from __future__ import annotations

import re
from typing import List, Dict, Any, Tuple

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Lazy-load the model to avoid slow import at module level
_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


# ─── JD Skill Extraction (simple NLP) ────────────────────────────────────────

# Skills and tech terms commonly found in JDs
_JD_SKILL_PATTERNS = re.compile(
    r"\b("
    r"python|java|javascript|typescript|c\+\+|c#|go|rust|kotlin|sql|r\b|"
    r"react|angular|vue|node\.?js|express|django|flask|fastapi|spring|"
    r"machine learning|deep learning|nlp|computer vision|"
    r"tensorflow|pytorch|keras|scikit.?learn|"
    r"pandas|numpy|matplotlib|seaborn|"
    r"aws|azure|gcp|docker|kubernetes|ci/?cd|git|linux|"
    r"postgresql|mysql|mongodb|redis|"
    r"rest api|graphql|microservices|"
    r"data structures|algorithms|oop|system design|agile|"
    r"communication|leadership|problem solving|teamwork"
    r")\b",
    re.IGNORECASE,
)


def extract_skills_from_jd(requirements_text: str) -> List[str]:
    """Extract skill tokens from JD requirements text."""
    matches = _JD_SKILL_PATTERNS.findall(requirements_text)
    return list({m.lower() for m in matches})


# ─── Eligibility Filter ───────────────────────────────────────────────────────

def check_eligibility(
    profile: Dict[str, Any],
    job: Dict[str, Any],
) -> Tuple[bool, List[Dict[str, str]]]:
    """
    Hard pass/fail eligibility check using academic profile vs job description.

    Returns:
        (is_eligible: bool, reasons: list of {field, reason} dicts)
    """
    reasons = []

    # Branch check
    eligible_branches = [b.upper() for b in (job.get("eligible_branches") or [])]
    if eligible_branches and profile.get("branch", "").upper() not in eligible_branches:
        reasons.append({
            "field": "branch",
            "reason": f"Your branch ({profile.get('branch')}) is not in eligible branches: {', '.join(eligible_branches)}",
        })

    # Batch year check
    if job.get("batch_year") and profile.get("batch_year") != job["batch_year"]:
        reasons.append({
            "field": "batch_year",
            "reason": f"This drive is for batch {job['batch_year']} only (your batch: {profile.get('batch_year')})",
        })

    # CGPA check
    if job.get("cgpa_cutoff") is not None:
        if (profile.get("cgpa") or 0) < job["cgpa_cutoff"]:
            reasons.append({
                "field": "cgpa",
                "reason": f"CGPA {profile.get('cgpa')} is below the cutoff of {job['cgpa_cutoff']}",
            })

    # Backlog check
    backlog_allowed = job.get("backlog_allowed", 0)
    student_backlogs = profile.get("backlog_count", 0)
    if student_backlogs > backlog_allowed:
        reasons.append({
            "field": "backlog_count",
            "reason": f"You have {student_backlogs} backlog(s); maximum allowed is {backlog_allowed}",
        })

    return len(reasons) == 0, reasons


# ─── Semantic Skill Match ─────────────────────────────────────────────────────

def compute_skill_match(
    resume_skills: List[str],
    resume_text: str,
    jd_requirements: str,
) -> Dict[str, Any]:
    """
    Semantic similarity between resume content and JD requirements.

    Strategy:
    1. Extract skill tokens from JD text.
    2. For each JD skill, compute cosine similarity with the resume's skill list
       using SBERT embeddings.
    3. Threshold > 0.5 = matched, <= 0.5 = missing.
    4. Overall score = average of top-N similarities (capped to JD skills).

    Returns:
        {
            "match_score": float (0–100),
            "matched_skills": list[str],
            "missing_skills": list[str],
        }
    """
    model = _get_model()

    jd_skills = extract_skills_from_jd(jd_requirements)
    if not jd_skills:
        # Fall back to full-text similarity
        jd_emb = model.encode([jd_requirements])
        resume_emb = model.encode([resume_text[:2000]])  # truncate for speed
        score = float(cosine_similarity(jd_emb, resume_emb)[0][0]) * 100
        return {
            "match_score": round(score, 1),
            "matched_skills": resume_skills[:5],
            "missing_skills": [],
        }

    # Encode all JD skills and all resume skills
    all_texts = jd_skills + resume_skills
    all_embs = model.encode(all_texts, batch_size=64, show_progress_bar=False)

    jd_embs = all_embs[: len(jd_skills)]
    res_embs = all_embs[len(jd_skills):]

    matched = []
    missing = []
    similarity_scores = []

    for i, jd_skill in enumerate(jd_skills):
        if len(res_embs) == 0:
            missing.append(jd_skill)
            similarity_scores.append(0.0)
            continue

        # Best match for this JD skill across all resume skills
        sims = cosine_similarity([jd_embs[i]], res_embs)[0]
        best_sim = float(np.max(sims))
        similarity_scores.append(best_sim)

        if best_sim >= 0.50:
            matched.append(jd_skill)
        else:
            missing.append(jd_skill)

    match_score = (
        round(float(np.mean(similarity_scores)) * 100, 1)
        if similarity_scores
        else 0.0
    )

    return {
        "match_score": min(match_score, 100.0),
        "matched_skills": matched,
        "missing_skills": missing,
    }
