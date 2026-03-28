"""
Pipeline orchestrator – runs the full fetch→filter→classify→score→store pipeline using Open States API.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional

from app.config import settings
from app.db.database import async_session
from app.db.crud import upsert_bill
from app.services.fetcher import openstates_client
from app.services.processor import is_animal_related
from app.services.llm_scorer import analyze_bill_with_llm
from app.services.relevance import RelevanceScorer

logger = logging.getLogger(__name__)

pipeline_progress = {
    "is_running": False,
    "progress": 0,
    "message": "Idle",
}


async def run_pipeline(
    states: Optional[List[str]] = None,
    force_refresh: bool = False,
    timeframe: str = "30d"
) -> Dict:
    """
    Execute the full pipeline for Open States API:
    1. Fetch bills for each jurisdiction
    2. Filter for animal-related content
    3. Classify as PRO/ANTI/NEUTRAL
    4. Score relevance
    5. Store in database
    """
    target_states = states or settings.target_states
    stats = {
        "states_processed": [],
        "total_fetched": 0,
        "total_relevant": 0,
        "total_stored": 0,
        "total_new": 0,
        "classifications": {"PRO": 0, "ANTI": 0, "NEUTRAL": 0},
        "errors": [],
        "started_at": datetime.utcnow().isoformat(),
    }

    pipeline_progress["is_running"] = True
    pipeline_progress["progress"] = 0
    pipeline_progress["message"] = "Initializing..."

    total_states = len(target_states)
    
    for idx, state in enumerate(target_states):
        try:
            base_progress = int((idx / total_states) * 100)
            pipeline_progress["progress"] = base_progress
            pipeline_progress["message"] = f"Fetching bills for {state}..."
            logger.info("=" * 60)
            logger.info("Processing state: %s", state)
            logger.info("=" * 60)

            # Step 1 & 3: Fetch detail-rich bills from Open States
            bills = await openstates_client.fetch_bills_for_state(state, timeframe=timeframe)
            stats["total_fetched"] += len(bills)

            # Step 2: Filter candidates
            candidates = []
            for b in bills:
                title = b.get("title", "")
                
                # Combine abstracts for description search
                abstracts = b.get("abstracts", [])
                desc = " ".join([a.get("abstract", "") for a in abstracts])
                
                # Identify if relevant
                is_relevant, keywords, density = is_animal_related(title, desc)
                if is_relevant:
                    b["_matched_keywords"] = keywords
                    b["_keyword_density"] = density
                    b["_description"] = desc
                    candidates.append(b)

            logger.info("Found %d animal-related candidates in %s", len(candidates), state)
            stats["total_relevant"] += len(candidates)

            if not candidates:
                stats["states_processed"].append({"state": state, "fetched": len(bills), "relevant": 0, "stored": 0})
                continue

            # Step 4 & 5: Classify, score, and store
            stored_count = 0
            new_count = 0
            async with async_session() as session:
                for detail in candidates:
                    try:
                        title = detail.get("title", "")
                        description = detail.get("_description", "")
                        
                        # Full text gathering - try remote document abstracts/docs
                        full_text = ""
                        docs = detail.get("documents", [])
                        if docs and isinstance(docs, list):
                            links = docs[0].get("links", [])
                            if links:
                                full_text = await openstates_client.get_bill_text(links[0].get("url", ""))
                        
                        # Use description if no full text
                        if not full_text:
                            full_text = description

                        pipeline_progress["message"] = f"[{state}] Validating bill {detail.get('identifier', '')} with OpenRouter LLM..."
                        
                        # Classify & Score via LLM
                        llm_result = await analyze_bill_with_llm(title, description, full_text)
                        
                        # If LLM says it's not actually relevant, skip it!
                        if not llm_result.get("is_relevant", True):
                            continue
                            
                        classification = llm_result.get("classification", "NEUTRAL")
                        score = llm_result.get("score", 0.0)
                        llm_reasoning = llm_result.get("reasoning", "")
                        confidence = 0.95  # Set high default since LLM is confident

                        # Sponsors mapping
                        raw_sponsors = detail.get("sponsorships", [])
                        sponsors = [{"name": s.get("name", ""), "type": s.get("classification", "")} for s in raw_sponsors]
                        
                        # Committee / Action mapping
                        actions = detail.get("actions", [])
                        status_val = "Unknown"
                        committee_name = "Unknown"
                        last_action = ""
                        last_action_date = ""
                        if actions:
                            # Last action
                            last = actions[-1]
                            status_val = last.get("description", "")
                            last_action = status_val
                            last_action_date = last.get("date", "")
                            # Try find committee mention
                            for a in actions:
                                act_desc = a.get("description", "").lower()
                                if "committee" in act_desc:
                                    committee_name = a.get("description", "")

                        # Calculate Algorithmic Relevance Score
                        kw_density = detail.get("_keyword_density", 0.0)
                        rel_score, rel_breakdown = await RelevanceScorer.calculate(
                            session, kw_density, committee_name, sponsors, classification=classification
                        )

                        # Database Record Mapping
                        record = {
                            "bill_id": str(detail.get("id")),
                            "state": state,
                            "session_id": str(detail.get("legislative_session", {}).get("identifier", "")).strip(),
                            "bill_number": detail.get("identifier", "Unknown"),
                            "title": title,
                            "description": description,
                            "full_text": full_text[:50000] if full_text else None,
                            "sponsors": sponsors,
                            "committee": committee_name,
                            "status": status_val,
                            "status_id": None,
                            "url": detail.get("openstates_url", ""),
                            "classification": classification,
                            "confidence": confidence,
                            "score": score,
                            "relevance_score": rel_score,
                            "relevance_breakdown": rel_breakdown,
                            "llm_reasoning": llm_reasoning,
                            "relevance_keywords": detail.get("_matched_keywords", []),
                            "last_action": last_action,
                            "last_action_date": last_action_date,
                            "change_hash": detail.get("updated_at", ""),
                        }

                        _, is_new = await upsert_bill(session, record)
                        stored_count += 1
                        if is_new:
                            new_count += 1
                        stats["classifications"][classification] += 1

                    except Exception as e:
                        logger.error("Error processing bill %s: %s", detail.get("id"), str(e))
                        stats["errors"].append(f"Bill {detail.get('id')}: {str(e)}")

            stats["total_stored"] += stored_count
            stats["total_new"] += new_count
            stats["states_processed"].append({
                "state": state,
                "fetched": len(bills),
                "relevant": len(candidates),
                "stored": stored_count,
                "new": new_count,
            })
            logger.info("Stored %d bills (%d new) for %s", stored_count, new_count, state)
            
            # API Rate Limiter
            # OpenStates Public API allows max 10 requests / minute. 
            # We must delay ~6.5s between states if we exceed 10. We will delay uniformly.
            if total_states > 1 and idx < total_states - 1:
                pipeline_progress["message"] = f"Sleeping 6.5s to respect API rate limit..."
                await asyncio.sleep(6.5)

        except Exception as e:
            logger.error("Error processing state %s: %s", state, str(e))
            stats["errors"].append(f"State {state}: {str(e)}")

    stats["completed_at"] = datetime.utcnow().isoformat()
    logger.info("Pipeline complete: %s", stats)
    
    pipeline_progress["progress"] = 100
    pipeline_progress["message"] = "Pipeline execution fully complete."
    pipeline_progress["is_running"] = False
    
    return stats
