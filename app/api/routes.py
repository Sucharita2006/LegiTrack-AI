"""
FastAPI REST endpoints for the Animal Legislation Tracker.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db import crud
from app.services.classifier import get_classification_details
from app.services.digest import generate_html_digest, generate_markdown_digest
from app.services.pipeline import run_pipeline, pipeline_progress

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Bills ────────────────────────────────────────────────────────

@router.get("/bills")
async def list_bills(
    state: Optional[str] = Query(None, description="Filter by state code (e.g. CA)"),
    classification: Optional[str] = Query(None, description="Filter by PRO, ANTI, or NEUTRAL"),
    min_score: Optional[float] = Query(None, description="Minimum score filter"),
    max_score: Optional[float] = Query(None, description="Maximum score filter"),
    keyword: Optional[str] = Query(None, description="Search keyword in title/description"),
    recent_only: bool = Query(False, description="Filter to show only bills inserted within 48 hours"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all tracked bills with optional filters."""
    bills = await crud.get_bills(
        db,
        state=state,
        classification=classification,
        min_score=min_score,
        max_score=max_score,
        keyword=keyword,
        recent_only=recent_only,
        limit=limit,
        offset=offset,
    )
    total = await crud.count_bills(db, state=state, classification=classification, recent_only=recent_only)
    return {
        "bills": [b.to_dict() for b in bills],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/bills/{bill_id}")
async def get_bill(bill_id: int, db: AsyncSession = Depends(get_db)):
    """Get full details for a specific bill."""
    bill = await crud.get_bill_by_id(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    result = bill.to_full_dict()

    # Include classification breakdown
    result["classification_details"] = get_classification_details(
        bill.title or "",
        bill.description or "",
        bill.full_text or "",
    )
    return result


@router.delete("/bills")
async def delete_bills_endpoint(
    delete_all: bool = Query(False, description="Delete all bills in the database"),
    bill_ids: list[str] = Body(default=[], description="List of bill IDs to delete"),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple bills or truncate the table."""
    try:
        if delete_all:
            count = await crud.delete_all_bills(db)
            return {"status": "success", "message": "All bills deleted", "deleted_count": count}
        
        if bill_ids:
            count = await crud.delete_bills(db, bill_ids)
            return {"status": "success", "message": f"{count} bills deleted", "deleted_count": count}
            
        raise HTTPException(status_code=400, detail="Must provide either 'delete_all=true' or a list of 'bill_ids' in the body")
    except Exception as e:
        logger.error("Bulk delete error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


# ── Statistics ───────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics."""
    return await crud.get_stats(db)


# ── Digest ───────────────────────────────────────────────────────

@router.get("/digest")
async def get_digest(
    format: str = Query("html", description="Output format: html or markdown"),
    db: AsyncSession = Depends(get_db),
):
    """Generate and return the weekly digest."""
    bills = await crud.get_bills(db, limit=200)

    if format.lower() == "markdown":
        content = generate_markdown_digest(bills)
        return {"format": "markdown", "content": content}

    html = generate_html_digest(bills)
    return HTMLResponse(content=html)


@router.get("/digest/download")
async def download_digest(
    format: str = Query("html", description="Output format: html or markdown"),
    db: AsyncSession = Depends(get_db),
):
    """Download the digest as a file."""
    bills = await crud.get_bills(db, limit=200)

    if format.lower() == "markdown":
        content = generate_markdown_digest(bills)
        return HTMLResponse(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": "attachment; filename=digest.md"},
        )

    html = generate_html_digest(bills)
    return HTMLResponse(
        content=html,
        media_type="text/html",
        headers={"Content-Disposition": "attachment; filename=digest.html"},
    )


# ── Pipeline ─────────────────────────────────────────────────────

@router.post("/run-pipeline")
async def trigger_pipeline(
    states: Optional[str] = Query(None, description="Comma-separated state codes"),
    force: bool = Query(False, description="Force re-fetch all bills"),
    timeframe: str = Query("30d", description="Timeframe to fetch: '24h', '30d', or 'all'"),
):
    """Trigger the data pipeline manually."""
    state_list = states.split(",") if states else None
    try:
        result = await run_pipeline(states=state_list, force_refresh=force, timeframe=timeframe)
        return {"status": "completed", "result": result}
    except Exception as e:
        logger.error("Pipeline error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")


@router.get("/run-pipeline/status")
async def get_pipeline_status():
    """Get the real-time background status of the data pipeline."""
    return pipeline_progress


# ── Health ───────────────────────────────────────────────────────

@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Animal Legislation Tracker"}
