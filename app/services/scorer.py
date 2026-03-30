"""
Relevance scorer – produces a 0-100 score based on
keyword density, sponsor history, and committee assignment.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

from app.config import settings
from app.services.processor import compute_keyword_density

logger = logging.getLogger(__name__)

# Maximum per-component scores
MAX_KEYWORD_SCORE = 40.0
MAX_SPONSOR_SCORE = 30.0
MAX_COMMITTEE_SCORE = 30.0


def score_keyword(title: str, description: str = "", full_text: str = "") -> float:
    """
    Keyword component score (0-40).
    Based on keyword density and presence across title/description/text.
    """
    title_density = compute_keyword_density(title) * 3.0        # Title gets 3x weight
    desc_density = compute_keyword_density(description) * 2.0   # Description gets 2x
    text_density = compute_keyword_density(full_text) * 1.0

    # Weighted combination
    combined = title_density + desc_density + text_density
    # Scale to 0-40 range (density of 0.05+ is very high)
    raw = min(combined / 0.06, 1.0) * MAX_KEYWORD_SCORE
    return round(raw, 2)


def score_sponsor(sponsors: Optional[List[dict]]) -> float:
    """
    Sponsor component score (0-30).
    Heuristic based on sponsor party and committee membership.
    In a production system, this would query historical voting records.
    """
    if not sponsors:
        return 0.0

    score = 0.0
    for sponsor in sponsors[:5]:  # Cap at 5 sponsors
        # Base score: having any sponsor is a signal
        score += 3.0

        # Party heuristic (simplified)
        party = str(sponsor.get("party", "")).upper()
        if party in ("D", "DEM", "DEMOCRAT"):
            score += 2.0  # Historically more animal welfare legislation
        elif party in ("R", "REP", "REPUBLICAN"):
            score += 1.0

        # Role heuristic
        role = str(sponsor.get("role", "")).lower()
        if "chair" in role or "lead" in role:
            score += 2.0

    return min(round(score, 2), MAX_SPONSOR_SCORE)


def score_committee(committee: Optional[str]) -> float:
    """
    Committee component score (0-30).
    Based on the relevance of the assigned committee.
    """
    if not committee:
        return 0.0

    committee_lower = committee.lower()
    best_score = 0.0

    for keyword, weight in settings.relevant_committees.items():
        if keyword in committee_lower:
            best_score = max(best_score, weight)

    return min(round(best_score, 2), MAX_COMMITTEE_SCORE)


def compute_relevance_score(
    title: str,
    description: str = "",
    full_text: str = "",
    sponsors: Optional[List[dict]] = None,
    committee: Optional[str] = None,
) -> Dict[str, float]:
    """
    Compute the full relevance score for a bill.

    Returns dict with:
        - keyword_score (0-40)
        - sponsor_score (0-30)
        - committee_score (0-30)
        - total_score (0-100)
    """
    kw = score_keyword(title, description, full_text)
    sp = score_sponsor(sponsors)
    cm = score_committee(committee)
    total = min(kw + sp + cm, 100.0)

    return {
        "keyword_score": kw,
        "sponsor_score": sp,
        "committee_score": cm,
        "total_score": round(total, 2),
    }
