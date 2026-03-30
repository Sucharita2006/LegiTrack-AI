"""
CLI script to run the data pipeline.
Usage: python scripts/run_pipeline.py [--states CA,NY,TX] [--force]
"""

import argparse
import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import init_db
from app.services.pipeline import run_pipeline


async def main():
    parser = argparse.ArgumentParser(description="Run the Animal Legislation Tracker pipeline")
    parser.add_argument("--states", type=str, default=None, help="Comma-separated state codes (e.g. CA,NY,TX)")
    parser.add_argument("--force", action="store_true", help="Force re-fetch all bills")
    args = parser.parse_args()

    await init_db()

    states = args.states.split(",") if args.states else None
    result = await run_pipeline(states=states, force_refresh=args.force)

    print("\n" + "=" * 60)
    print("  PIPELINE RESULTS")
    print("=" * 60)
    print(f"  States processed: {len(result.get('states_processed', []))}")
    print(f"  Total fetched:    {result.get('total_fetched', 0)}")
    print(f"  Total relevant:   {result.get('total_relevant', 0)}")
    print(f"  Total stored:     {result.get('total_stored', 0)}")
    print(f"  Classifications:  {result.get('classifications', {})}")

    if result.get("errors"):
        print(f"\n  ⚠ Errors ({len(result['errors'])}):")
        for err in result["errors"][:10]:
            print(f"    - {err}")

    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
