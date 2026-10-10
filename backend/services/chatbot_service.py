"""
services/chatbot_service.py
Chatbot powered by the Nexus API (OpenAI-compatible).
Two modes: "qa" (student asks questions) and "mock_interview" (AI drives).
Personalisation: injects student's resume skills + roadmap progress as context.
"""
from __future__ import annotations

from typing import List, Dict, Any, Optional

import httpx

from config import get_settings

settings = get_settings()


# ─── System prompts ───────────────────────────────────────────────────────────

QA_SYSTEM_PROMPT = """\
You are an expert campus placement preparation mentor and technical coach for engineering students in India.
You have access to the student's profile below. Use it to provide highly personalised, structured, and easy-to-read answers.

Student profile:
{profile_block}

FORMATTING GUIDELINES (STRICT):
1. Never output long unbroken paragraphs. Break concepts down into scannable chunks.
2. Use clean markdown formatting with headers:
   - Use `### 💡 Quick Summary` for the direct answer.
   - Use `### 🔍 Key Concepts` or bullet points with bold keywords (`- **Term**: explanation`) for deep dives.
   - Use fenced code blocks with language identifiers (e.g. ```python, ```java, ```sql) for all code snippets, including comments.
   - Use `### 🎯 Placement Interview Tip` for real-world campus interview advice.
3. Be encouraging, concise, practical, and rigorous.
"""

MOCK_INTERVIEW_SYSTEM_PROMPT = """\
You are a senior technical interviewer conducting a mock campus placement interview for an engineering student in India.
The student is targeting: {target_role}

Student profile:
{profile_block}

FORMATTING & INTERVIEW PROTOCOL (STRICT):
1. Ask ONE question at a time.
2. When the student answers, structure your response as follows:
   - `### 💬 Evaluation & Feedback`: 2-3 concise sentences grading their answer (Strengths + Improvements).
   - `### 💡 Ideal Approach`: A bullet point highlighting how a top candidate would answer (mention STAR method for behavioral).
   - `### ❓ Next Question`: The next technical or behavioral question, tailored to their level.
3. If this is the start of the interview, greet the candidate warmly, set expectations, and ask them to introduce themselves and highlight their key technical project.
"""


def _build_profile_block(
    skills: List[str],
    target_role: Optional[str],
    roadmap_progress: Optional[List[Dict[str, Any]]],
) -> str:
    skills_str = ", ".join(skills) if skills else "Not provided"
    role_str = target_role or "Not specified"

    completed_items = []
    in_progress_items = []
    if roadmap_progress:
        for p in roadmap_progress:
            if p.get("status") == "completed":
                completed_items.append(p.get("item_id", ""))
            elif p.get("status") == "in_progress":
                in_progress_items.append(p.get("item_id", ""))

    progress_str = ""
    if completed_items:
        progress_str += f"\n  - Completed roadmap items: {', '.join(completed_items[:5])}"
    if in_progress_items:
        progress_str += f"\n  - Currently learning: {', '.join(in_progress_items[:3])}"

    return (
        f"- Skills from resume: {skills_str}\n"
        f"- Target role: {role_str}"
        f"{progress_str}"
    )


async def chat(
    messages: List[Dict[str, str]],
    mode: str,
    skills: List[str],
    target_role: Optional[str],
    roadmap_progress: Optional[List[Dict[str, Any]]],
) -> str:
    """
    Send a conversation to the Nexus API and return the assistant's reply.

    Args:
        messages: List of {"role": "user"/"assistant", "content": str}
        mode: "qa" or "mock_interview"
        skills: Extracted skills from the student's latest resume
        target_role: Student's target role from active roadmap (if any)
        roadmap_progress: List of roadmap progress dicts

    Returns:
        The assistant's reply string.
    """
    profile_block = _build_profile_block(skills, target_role, roadmap_progress)

    if mode == "mock_interview":
        system_content = MOCK_INTERVIEW_SYSTEM_PROMPT.format(
            target_role=target_role or "Software Engineer",
            profile_block=profile_block,
        )
    else:
        system_content = QA_SYSTEM_PROMPT.format(profile_block=profile_block)

    full_messages = [{"role": "system", "content": system_content}] + messages

    payload = {
        "model": "gpt-4.1-nano",
        "messages": full_messages,
        "temperature": 0.7,
        "max_tokens": 800,
    }

    headers = {
        "Authorization": f"Bearer {settings.nexus_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.nexus_api_base_url}/v1/chat/completions",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

    data = response.json()
    return data["choices"][0]["message"]["content"].strip()
