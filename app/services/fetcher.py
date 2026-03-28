"""
Open States API Client – fetches bills, bill details, and abstracts.
"""

from __future__ import annotations

from datetime import datetime, timedelta
import asyncio
import logging
from typing import Any, Dict, List, Optional

import httpx
from app.config import settings

logger = logging.getLogger(__name__)



class OpenStatesClient:
    """Async client wrapping the Open States V3 REST API."""

    def __init__(self) -> None:
        self.base_url = settings.openstates_base_url.rstrip('/') + '/'
        self.api_key = settings.openstates_api_key
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0, headers={"x-api-key": self.api_key})
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _request(self, endpoint: str, params: dict) -> dict:
        """Execute a single API request."""
        client = await self._get_client()
        url = f"{self.base_url}{endpoint.lstrip('/')}"
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            return data
        except httpx.HTTPStatusError as e:
            logger.error("HTTP error %s on %s: %s", e.response.status_code, url, e.response.text)
            return {}
        except Exception as e:
            logger.error("Request error: %s", str(e))
            return {}

    # ── Endpoints ────────────────────────────────────────────────

    async def fetch_bills_for_state(self, state: str, timeframe: str = "30d") -> List[dict]:
        """
        Fetch all recent bills from the current session for a state.
        Includes extensive detail thanks to 'include' param.
        """
        logger.info("Fetching bills from Open States for jurisdiction: %s with timeframe: %s", state.lower(), timeframe)
        params = {
            "jurisdiction": state.lower(),
            "sort": "updated_desc",
            "per_page": 20,
            "include": ["sponsorships", "actions", "abstracts"]
        }
        
        # Apply updated_since temporal filter based on timeframe string
        if timeframe in ["24h", "30d"]:
            days = 1 if timeframe == "24h" else 30
            updated_since = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
            params["updated_since"] = updated_since
            logger.info("Applying updated_since filter: %s", updated_since)
        data = await self._request("bills", params)
        results = data.get("results", [])
        
        # Map them into a format loosely resembling our old expected dict, but we will adapt pipeline proper too
        mapped_bills = []
        for b in results:
            b["state"] = state.upper()
            mapped_bills.append(b)
            
        logger.info("Found %d recent bills for %s", len(mapped_bills), state)
        return mapped_bills

    async def fetch_bill_details_batch(self, bill_ids: List[str], delay: float = 0.25) -> List[dict]:
        """
        In the new Open States integration, detail is already fetched within fetch_bills_for_state.
        This function acts as a pass-through to avoid API overuse.
        """
        return []

    async def get_bill_text(self, document_url: str) -> str:
        """
        We'll use document abstracts and descriptions instead of downloading raw PDFs,
        so this just returns an empty string or fetches basic HTML if provided a plaintext url.
        """
        if not document_url or document_url.endswith(".pdf"):
            return ""
        
        try:
            client = await self._get_client()
            resp = await client.get(document_url)
            resp.raise_for_status()
            # If it's a simple text or html page, return a snippet
            return resp.text[:50000]
        except Exception:
            pass
        return ""

# Singleton
openstates_client = OpenStatesClient()
