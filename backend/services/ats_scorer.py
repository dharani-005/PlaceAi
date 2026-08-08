"""
services/ats_scorer.py
Rule-based ATS scoring engine. Returns a 0–100 score and per-category breakdown.
No AI/API required — deterministic and fast.

Category weights (must sum to 100):
  contact_info              10
  standard_sections         15
  parsability               10
  quantified_achievements   20
  action_verbs              10
  appropriate_length        10
  keyword_density           15
  spelling                  10
"""
from __future__ import annotations

import re
from typing import Dict, Any, List


# ─── Config ───────────────────────────────────────────────────────────────────

WEIGHTS: Dict[str, float] = {
    "contact_info": 10,
    "standard_sections": 15,
    "parsability": 10,
    "quantified_achievements": 20,
    "action_verbs": 10,
    "appropriate_length": 10,
    "keyword_density": 15,
    "spelling": 10,
}

REQUIRED_SECTIONS = ["education", "experience", "skills", "projects"]

ACTION_VERBS = {
    "developed", "built", "designed", "implemented", "created", "led", "managed",
    "improved", "optimized", "reduced", "increased", "achieved", "delivered",
    "collaborated", "engineered", "architected", "deployed", "automated",
    "integrated", "maintained", "migrated", "launched", "coordinated", "analysed",
    "analyzed", "researched", "presented", "published", "solved", "resolved",
}

# Simplified common misspelling set (extend as needed)
COMMON_MISSPELLINGS = {
    "recieve", "occured", "seperate", "occurance", "responsibilites",
    "experiance", "acheived", "managment", "developement", "knowlege",
}


# ─── Individual checks ────────────────────────────────────────────────────────

def _check_contact_info(text: str) -> float:
    """10 pts — email + phone presence."""
    has_email = bool(re.search(r"[\w.+-]+@[\w-]+\.\w+", text))
    has_phone = bool(re.search(r"(\+?\d[\d\s\-().]{7,}\d)", text))
    score = 0.0
    if has_email:
        score += 5
    if has_phone:
        score += 5
    return score


def _check_standard_sections(text: str) -> float:
    """15 pts — presence of required sections."""
    text_lower = text.lower()
    found = sum(1 for s in REQUIRED_SECTIONS if s in text_lower)
    return (found / len(REQUIRED_SECTIONS)) * 15


def _check_parsability(text: str) -> float:
    """
    10 pts — proxy: if text extraction gave reasonable content (not garbage).
    Heuristic: char diversity and word count.
    """
    words = text.split()
    word_count = len(words)
    if word_count < 50:
        return 0.0
    # Check for reasonable character distribution (not all symbols/numbers)
    alpha_ratio = sum(c.isalpha() for c in text) / max(len(text), 1)
    if alpha_ratio < 0.5:
        return 5.0   # Partial — likely has tables/images messing things up
    return 10.0


def _check_quantified_achievements(text: str) -> float:
    """20 pts — presence of numbers/metrics in bullet-like lines."""
    lines = text.split("\n")
    bullet_lines = [
        l.strip() for l in lines
        if l.strip().startswith(("•", "-", "*", "·")) or re.match(r"^\d+\.", l.strip())
    ]
    if not bullet_lines:
        # Try lines that are plausibly bullets even without symbol
        bullet_lines = [l.strip() for l in lines if 20 < len(l.strip()) < 200]

    quantified = sum(
        1 for line in bullet_lines
        if re.search(r"\d+\s*(%|x|times|lpa|cr|k\b|million|hours?|users?|projects?)", line, re.IGNORECASE)
        or re.search(r"\b\d{2,}\b", line)
    )
    ratio = min(quantified / max(len(bullet_lines), 1), 1.0)
    return round(ratio * 20, 1)


def _check_action_verbs(text: str) -> float:
    """10 pts — action verbs at start of bullet points."""
    lines = text.lower().split("\n")
    bullet_lines = [
        re.sub(r"^[•\-\*·\d\.]+\s*", "", l.strip())
        for l in lines
        if l.strip()
    ]
    if not bullet_lines:
        return 0.0
    action_count = sum(
        1 for line in bullet_lines
        if line.split()[0] in ACTION_VERBS if line.split()
    )
    ratio = min(action_count / max(len(bullet_lines), 1), 1.0)
    return round(ratio * 10, 1)


def _check_appropriate_length(text: str) -> float:
    """10 pts — word count heuristic for 1–2 page resume."""
    word_count = len(text.split())
    if 300 <= word_count <= 900:
        return 10.0
    elif 200 <= word_count < 300 or 900 < word_count <= 1200:
        return 7.0
    elif 100 <= word_count < 200:
        return 4.0
    else:
        return 0.0


def _check_keyword_density(text: str, skill_count: int) -> float:
    """
    15 pts — proxy: extracted skill count relative to expected density.
    More than 10 unique skills = full marks.
    """
    if skill_count >= 10:
        return 15.0
    elif skill_count >= 6:
        return 10.0
    elif skill_count >= 3:
        return 5.0
    return 0.0


def _check_spelling(text: str) -> float:
    """10 pts — deduct for common misspellings found in text."""
    text_lower = text.lower()
    errors = sum(1 for word in COMMON_MISSPELLINGS if re.search(r"\b" + word + r"\b", text_lower))
    if errors == 0:
        return 10.0
    elif errors <= 2:
        return 6.0
    elif errors <= 4:
        return 3.0
    return 0.0


# ─── Public API ───────────────────────────────────────────────────────────────

def compute_ats_score(text: str, skill_count: int) -> Dict[str, Any]:
    """
    Runs all checks and returns:
    {
        "total_score": float (0–100),
        "breakdown": { category: float, ... }
    }
    """
    breakdown = {
        "contact_info": _check_contact_info(text),
        "standard_sections": _check_standard_sections(text),
        "parsability": _check_parsability(text),
        "quantified_achievements": _check_quantified_achievements(text),
        "action_verbs": _check_action_verbs(text),
        "appropriate_length": _check_appropriate_length(text),
        "keyword_density": _check_keyword_density(text, skill_count),
        "spelling": _check_spelling(text),
    }

    total = sum(breakdown.values())
    return {
        "total_score": round(min(total, 100.0), 1),
        "breakdown": breakdown,
    }
