"""
Bill classifier – labels bills as PRO, ANTI, or NEUTRAL based on
weighted keyword analysis of their text content.
"""

from __future__ import annotations

import logging
import re
from typing import Tuple

from app.config import settings

logger = logging.getLogger(__name__)


def _count_weighted(text: str, keyword_weights: dict) -> float:
    """Sum weighted scores for keywords found in text."""
    text_lower = text.lower()
    total = 0.0
    for phrase, weight in keyword_weights.items():
        # Count occurrences of each keyword phrase
        count = len(re.findall(re.escape(phrase.lower()), text_lower))
        total += count * weight
    return total


def classify_bill(
    title: str,
    description: str = "",
    full_text: str = "",
) -> Tuple[str, float]:
    """
    Classify a bill as PRO, ANTI, or NEUTRAL.

    Returns:
        (classification, confidence)
        - classification: "PRO", "ANTI", or "NEUTRAL"
        - confidence: 0.0 to 1.0
    """
    combined = f"{title} {description} {full_text}".strip()
    if not combined:
        return "NEUTRAL", 0.0

    pro_score = _count_weighted(combined, settings.pro_keywords)
    anti_score = _count_weighted(combined, settings.anti_keywords)

    # Anti scores are already negative in config, so negate to make positive
    anti_magnitude = abs(anti_score)

    net_score = pro_score - anti_magnitude
    total_magnitude = pro_score + anti_magnitude

    # Determine classification
    if total_magnitude == 0:
        return "NEUTRAL", 0.0

    # Confidence is how dominant one side is
    confidence = abs(net_score) / (total_magnitude + 1)
    confidence = min(confidence, 1.0)

    if net_score > 1.5:
        classification = "PRO"
    elif net_score < -1.5:
        classification = "ANTI"
    else:
        classification = "NEUTRAL"
        # Low confidence for neutral
        confidence = max(0.0, 1.0 - (total_magnitude / 10))

    return classification, round(confidence, 3)


def get_classification_details(
    title: str,
    description: str = "",
    full_text: str = "",
) -> dict:
    """Get detailed breakdown of classification scoring."""
    combined = f"{title} {description} {full_text}".strip()

    pro_matches = {}
    anti_matches = {}

    text_lower = combined.lower()
    for phrase, weight in settings.pro_keywords.items():
        count = len(re.findall(re.escape(phrase.lower()), text_lower))
        if count > 0:
            pro_matches[phrase] = {"count": count, "weight": weight, "score": count * weight}

    for phrase, weight in settings.anti_keywords.items():
        count = len(re.findall(re.escape(phrase.lower()), text_lower))
        if count > 0:
            anti_matches[phrase] = {"count": count, "weight": weight, "score": count * abs(weight)}

    classification, confidence = classify_bill(title, description, full_text)

    return {
        "classification": classification,
        "confidence": confidence,
        "pro_score": sum(m["score"] for m in pro_matches.values()),
        "anti_score": sum(m["score"] for m in anti_matches.values()),
        "pro_matches": pro_matches,
        "anti_matches": anti_matches,
    }
