"""
CRUD helpers for the bills table.
"""

from __future__ import annotations

import datetime
from typing import List, Optional

from sqlalchemy import func, select, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Bill


# ── CREATE / UPSERT ──────────────────────────────────────────────

async def upsert_bill(session: AsyncSession, data: dict) -> tuple[Bill, bool]:
    """Insert a new bill or update an existing one (matched on bill_id).
    Returns (bill, is_new) where is_new is True if the bill was newly inserted."""
    stmt = select(Bill).where(Bill.bill_id == data["bill_id"])
    result = await session.execute(stmt)
    bill = result.scalar_one_or_none()

    is_new = bill is None
    if is_new:
        bill = Bill(**data)
        session.add(bill)
    else:
        for key, value in data.items():
            if value is not None:
                setattr(bill, key, value)

    await session.commit()
    await session.refresh(bill)
    return bill, is_new


# ── READ ─────────────────────────────────────────────────────────

async def get_bills(
    session: AsyncSession,
    state: Optional[str] = None,
    classification: Optional[str] = None,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    keyword: Optional[str] = None,
    recent_only: bool = False,
    limit: int = 100,
    offset: int = 0,
) -> List[Bill]:
    """Fetch bills with optional filters."""
    stmt = select(Bill)

    if state:
        stmt = stmt.where(Bill.state == state.upper())
    if classification:
        stmt = stmt.where(Bill.classification == classification.upper())
    if min_score is not None:
        stmt = stmt.where(Bill.score >= min_score)
    if max_score is not None:
        stmt = stmt.where(Bill.score <= max_score)
    if keyword:
        pattern = f"%{keyword}%"
        stmt = stmt.where(
            or_(
                Bill.title.ilike(pattern),
                Bill.description.ilike(pattern),
            )
        )

    if recent_only:
        two_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=2)
        stmt = stmt.where(Bill.created_at >= two_days_ago)

    stmt = stmt.order_by(Bill.score.desc().nullslast()).offset(offset).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_bill_by_id(session: AsyncSession, bill_id: str) -> Optional[Bill]:
    """Fetch a single bill by its Open States bill_id."""
    stmt = select(Bill).where(Bill.bill_id == bill_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def count_bills(
    session: AsyncSession,
    state: Optional[str] = None,
    classification: Optional[str] = None,
    recent_only: bool = False,
) -> int:
    """Count bills with optional filters."""
    stmt = select(func.count(Bill.id))
    if state:
        stmt = stmt.where(Bill.state == state.upper())
    if classification:
        stmt = stmt.where(Bill.classification == classification.upper())
    if recent_only:
        two_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=2)
        stmt = stmt.where(Bill.created_at >= two_days_ago)
    result = await session.execute(stmt)
    return result.scalar() or 0


async def get_stats(session: AsyncSession) -> dict:
    """Aggregate statistics for the dashboard."""
    total = await count_bills(session)
    pro = await count_bills(session, classification="PRO")
    anti = await count_bills(session, classification="ANTI")
    neutral = await count_bills(session, classification="NEUTRAL")

    # Per-state breakdown
    states_stmt = (
        select(Bill.state, Bill.classification, func.count(Bill.id))
        .group_by(Bill.state, Bill.classification)
    )
    result = await session.execute(states_stmt)
    state_breakdown = {}
    for state, cls, cnt in result.all():
        state_breakdown.setdefault(state, {"PRO": 0, "ANTI": 0, "NEUTRAL": 0, "total": 0})
        if cls:
            state_breakdown[state][cls] = cnt
        state_breakdown[state]["total"] += cnt

    # Average score
    avg_stmt = select(func.avg(Bill.score)).where(Bill.score.isnot(None))
    avg_result = await session.execute(avg_stmt)
    avg_score = avg_result.scalar() or 0.0

    # Recent bills
    recent_stmt = select(Bill).order_by(Bill.created_at.desc()).limit(5)
    recent_result = await session.execute(recent_stmt)
    recent_bills = [b.to_dict() for b in recent_result.scalars().all()]

    # Score distribution
    score_dist_stmt = (
        select(
            func.floor(Bill.score / 10) * 10,
            func.count(Bill.id),
        )
        .where(Bill.score.isnot(None))
        .group_by(func.floor(Bill.score / 10) * 10)
        .order_by(func.floor(Bill.score / 10) * 10)
    )
    score_result = await session.execute(score_dist_stmt)
    score_distribution = [
        {"range": f"{int(r)}-{int(r)+9}", "count": c}
        for r, c in score_result.all()
        if r is not None
    ]

    return {
        "total": total,
        "pro": pro,
        "anti": anti,
        "neutral": neutral,
        "state_breakdown": state_breakdown,
        "average_score": round(avg_score, 2),
        "recent_bills": recent_bills,
        "score_distribution": score_distribution,
    }


# ── DELETE ───────────────────────────────────────────────────────

async def delete_bills(session: AsyncSession, bill_ids: List[str]) -> int:
    """Delete specific bills by their bill_id."""
    if not bill_ids:
        return 0
    stmt = delete(Bill).where(Bill.bill_id.in_(bill_ids))
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount

async def delete_all_bills(session: AsyncSession) -> int:
    """Delete all bills from the database."""
    stmt = delete(Bill)
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount
