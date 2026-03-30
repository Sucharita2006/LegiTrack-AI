"""
FastAPI application entry point.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import init_db
from app.api.routes import router

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown tasks."""
    logger.info("Starting %s v%s", settings.app_title, settings.app_version)
    
    # Download required NLTK data for production environment (Render)
    import nltk
    try:
        nltk.download("punkt", quiet=True)
        nltk.download("punkt_tab", quiet=True)
        logger.info("NLTK 'punkt' and 'punkt_tab' datasets are ready.")
    except Exception as e:
        logger.warning("Failed to download NLTK data: %s", e)
    await init_db()
    logger.info("Database initialized.")

    # Optional: set up APScheduler for weekly digest
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from app.services.pipeline import run_pipeline

        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            run_pipeline,
            "cron",
            day_of_week=settings.digest_cron_day_of_week,
            hour=settings.digest_cron_hour,
            minute=settings.digest_cron_minute,
            id="weekly_pipeline",
        )
        scheduler.start()
        logger.info("Scheduler started (weekly pipeline on %s at %02d:%02d)",
                     settings.digest_cron_day_of_week,
                     settings.digest_cron_hour,
                     settings.digest_cron_minute)
    except Exception as e:
        logger.warning("Scheduler not started: %s", e)

    yield

    # Shutdown
    from app.services.fetcher import openstates_client
    await openstates_client.close()
    logger.info("Shutdown complete.")


# ── App ──────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": settings.app_title,
        "version": settings.app_version,
        "docs": "/docs",
    }
