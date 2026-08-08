"""
services/roadmap_gen.py
Calls the Nexus API (OpenAI-compatible) to generate a personalized learning roadmap.
The result is parsed into a structured list of RoadmapItems and saved once to DB.
"""
from __future__ import annotations

import json
import uuid
from typing import List, Dict, Any

import httpx

from config import get_settings

settings = get_settings()


SYSTEM_PROMPT = """\
You are a career guidance expert specializing in campus placements in India.
Generate a structured, personalized learning roadmap for a student targeting a specific role.

Respond ONLY with a valid JSON array (no markdown, no explanation). Each item must have:
{
  "id": "<unique_short_slug>",
  "title": "<concise topic title>",
  "description": "<2-3 sentence explanation of what to learn and why it matters for the role>",
  "order": <integer starting at 1>,
  "category": "<one of: Foundation, Core Skills, Tools, Projects, Soft Skills>"
}

Generate 10–15 items ordered from foundational to advanced.
"""


def _build_user_prompt(target_role: str, current_skills: List[str]) -> str:
    skills_str = ", ".join(current_skills) if current_skills else "none listed"
    return (
        f"Target role: {target_role}\n"
        f"Student's current skills (from their resume): {skills_str}\n\n"
        "Generate a personalised learning roadmap that fills the gaps for this role. "
        "Skip topics the student already knows well. "
        "Focus on what will directly help them get placed."
    )


async def generate_roadmap(
    target_role: str,
    current_skills: List[str],
) -> List[Dict[str, Any]]:
    """
    Calls Nexus API and returns a parsed list of roadmap items.
    Raises ValueError if the response cannot be parsed.
    """
    user_prompt = _build_user_prompt(target_role, current_skills)

    payload = {
        "model": "gpt-4.1-nano",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 2000,
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
    content = data["choices"][0]["message"]["content"].strip()

    # Strip markdown code fences if present
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    items = json.loads(content)

    # Ensure IDs are unique slugs
    seen_ids = set()
    for item in items:
        if item.get("id") in seen_ids or not item.get("id"):
            item["id"] = str(uuid.uuid4())[:8]
        seen_ids.add(item["id"])

    return items
