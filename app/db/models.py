"""
SQLAlchemy ORM models.
"""

from __future__ import annotations

import datetime

from sqlalchemy import (
    Column, DateTime, Float, Integer, String, Text, JSON, Index,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bill_id = Column(String(128), unique=True, nullable=False, index=True)
    state = Column(String(4), nullable=False, index=True)
    session_id = Column(String(32), nullable=True)
    bill_number = Column(String(32), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    full_text = Column(Text, nullable=True)
    sponsors = Column(JSON, nullable=True)          # list of dicts
    committee = Column(String(256), nullable=True)
    status = Column(String(128), nullable=True)
    status_id = Column(Integer, nullable=True)
    url = Column(Text, nullable=True)

    # ── Classification & Scoring ──────────────────────────────────
    classification = Column(String(16), nullable=True, index=True)   # PRO / ANTI / NEUTRAL
    score = Column(Float, nullable=True)                             # Kept for backward compat/LLM severity
    relevance_score = Column(Integer, nullable=True)                 # Algorithmic 0-100 logic score
    relevance_breakdown = Column(JSON, nullable=True)                # Component breakdowns
    llm_reasoning = Column(Text, nullable=True)                      # 1-2 sentence AI explanation
    confidence = Column(Float, default=0.0)
    relevance_keywords = Column(JSON, nullable=True)  # matched keywords

    # ── Metadata ──────────────────────────────────────────────────
    last_action = Column(String(256), nullable=True)
    last_action_date = Column(String(32), nullable=True)
    change_hash = Column(String(64), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    __table_args__ = (
        Index("ix_bills_state_classification", "state", "classification"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "bill_id": self.bill_id,
            "state": self.state,
            "session_id": self.session_id,
            "bill_number": self.bill_number,
            "title": self.title,
            "description": self.description,
            "full_text": self.full_text[:500] if self.full_text else None,
            "sponsors": self.sponsors,
            "committee": self.committee,
            "status": self.status,
            "status_id": self.status_id,
            "url": self.url,
            "classification": self.classification,
            "score": self.score,
            "relevance_score": self.relevance_score,
            "relevance_breakdown": self.relevance_breakdown,
            "llm_reasoning": self.llm_reasoning,
            "confidence": self.confidence,
            "relevance_keywords": self.relevance_keywords,
            "last_action": self.last_action,
            "last_action_date": self.last_action_date,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_full_dict(self) -> dict:
        d = self.to_dict()
        d["full_text"] = self.full_text
        return d
