"""
Keyword-based processor for filtering animal-related bills.
Uses NLTK for tokenization and stemming.
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Set, Tuple

from app.config import settings

logger = logging.getLogger(__name__)

# ── NLTK Setup ────────────────────────────────────────────────────
try:
    import nltk
    from nltk.stem import PorterStemmer
    from nltk.tokenize import word_tokenize
    
    # Check if packages exist locally
    nltk.data.find("tokenizers/punkt")
    nltk.data.find("tokenizers/punkt_tab")

    stemmer = PorterStemmer()
    HAS_NLTK = True
except Exception as e:
    logger.warning(f"NLTK or its data (punkt/punkt_tab) is not found or corrupt: {e}. Falling back to basic regex tokenization and no stemming.")
    HAS_NLTK = False
    stemmer = None  # type: ignore[assignment]


def _tokenize(text: str) -> List[str]:
    """Tokenize and lowercase text."""
    if HAS_NLTK:
        return word_tokenize(text.lower())
    return re.findall(r"\b[a-z]+\b", text.lower())


def _stem(word: str) -> str:
    if stemmer:
        return stemmer.stem(word)
    return word


# Pre-compute stemmed keywords for faster matching
_stemmed_keywords: Set[str] = set()
_keyword_to_original: Dict[str, str] = {}

for kw in settings.animal_keywords:
    tokens = _tokenize(kw)
    for t in tokens:
        s = _stem(t)
        _stemmed_keywords.add(s)
        _keyword_to_original[s] = kw


def is_animal_related(title: str, description: str = "", full_text: str = "") -> Tuple[bool, List[str], float]:
    """
    Determine if a bill is animal-related.

    Returns:
        (is_related, matched_keywords, keyword_density)
    """
    combined = f"{title} {description} {full_text}".strip()
    if not combined:
        return False, [], 0.0

    tokens = _tokenize(combined)
    if not tokens:
        return False, [], 0.0

    stemmed_tokens = [_stem(t) for t in tokens]

    matched: Set[str] = set()
    match_count = 0

    for st in stemmed_tokens:
        if st in _stemmed_keywords:
            match_count += 1
            original = _keyword_to_original.get(st, st)
            matched.add(original)

    # Also do direct substring matching for multi-word keywords
    combined_lower = combined.lower()
    for kw in settings.animal_keywords:
        if len(kw.split()) > 1 and kw.lower() in combined_lower:
            matched.add(kw)
            match_count += combined_lower.count(kw.lower())

    density = match_count / len(tokens) if tokens else 0.0
    is_related = len(matched) >= 2 or density > 0.01

    return is_related, sorted(matched), round(density, 6)


def compute_keyword_density(text: str) -> float:
    """Compute keyword density for a given text fragment."""
    if not text:
        return 0.0
    tokens = _tokenize(text)
    if not tokens:
        return 0.0

    stemmed_tokens = [_stem(t) for t in tokens]
    match_count = sum(1 for st in stemmed_tokens if st in _stemmed_keywords)
    return round(match_count / len(tokens), 6)
