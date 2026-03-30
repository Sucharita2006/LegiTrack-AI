"""
Application configuration using pydantic-settings.
All settings can be overridden via environment variables or a .env file.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve paths relative to project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── API Keys ───────────────────────────────────────────
    openstates_api_key: str = ""
    openrouter_api_key: str = ""
    openstates_base_url: str = "https://v3.openstates.org/"

    # ── Target States ─────────────────────────────────────────────
    target_states: List[str] = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ]

    # ── Database ──────────────────────────────────────────────────
    database_url: str = f"sqlite+aiosqlite:///{DATA_DIR / 'legislation.db'}"

    # ── Keywords ──────────────────────────────────────────────────
    animal_keywords: List[str] = [
        "animal", "wildlife", "livestock", "cruelty", "hunting",
        "conservation", "endangered", "veterinary", "poultry",
        "cattle", "fisheries", "marine", "habitat", "poaching",
        "slaughter", "shelter", "rescue", "humane", "welfare",
        "exotic", "fur", "trapping", "trophy", "ivory",
        "pet", "puppy", "kitten", "breed", "kennel",
        "sanctuary", "captive", "zoo", "circus", "rodeo",
    ]

    # ── PRO / ANTI weighted keywords ─────────────────────────────
    pro_keywords: dict = {
        "protect": 3, "protection": 3, "welfare": 3, "humane": 3,
        "rescue": 2, "sanctuary": 3, "endangered": 2,
        "ban cruelty": 4, "prevent abuse": 4, "shelter": 2,
        "conservation": 2, "rehabilitate": 2, "adopt": 1,
        "spay": 1, "neuter": 1, "anti-cruelty": 4,
        "animal rights": 3, "habitat restoration": 3,
        "captive breeding ban": 3, "fur ban": 4,
    }

    anti_keywords: dict = {
        "hunt": -2, "hunting": -2, "kill": -3, "slaughter": -3,
        "trophy": -3, "deregulate": -2, "weaken protections": -4,
        "remove restrictions": -3, "expand hunting": -3,
        "predator control": -2, "lethal removal": -3,
        "aerial gunning": -3, "trapping": -2,
        "canned hunt": -4, "captive hunt": -4,
        "factory farm": -2, "ag-gag": -4,
    }

    # ── Committee relevance mapping ──────────────────────────────
    relevant_committees: dict = {
        "agriculture": 25, "environment": 28, "natural resources": 28,
        "wildlife": 30, "animal": 30, "conservation": 25,
        "fish and game": 28, "ecology": 25, "public health": 15,
        "judiciary": 10, "appropriations": 5,
    }

    # ── Scheduler ─────────────────────────────────────────────────
    digest_cron_day_of_week: str = "mon"
    digest_cron_hour: int = 8
    digest_cron_minute: int = 0

    # ── App ────────────────────────────────────────────────────────
    app_title: str = "Animal Legislation Tracker"
    app_version: str = "1.0.0"
    cors_origins: List[str] = [
        "http://localhost:5173", 
        "http://localhost:3000", 
        "https://legi-track-ai.vercel.app"
    ]


settings = Settings()
