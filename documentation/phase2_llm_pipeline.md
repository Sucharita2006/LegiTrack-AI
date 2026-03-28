# Phase 2: LLM Intelligence Pipeline

## Overview
This phase integrated the system's core intelligence engine. We replaced primitive keyword-based sentiment analysis with a robust pipeline: Open States ingestion, NLP noise reduction, and LLM legal classification.

## Key Components

### 1. Open States Fetcher (`app/services/fetcher.py`)
- Created an asynchronous HTTP client explicitly wrapping the modern Open States v3 GraphQL API.
- Implemented recursive state-level data gathering functions querying base bill metadata (Titles, States, Summaries, Sponsors) natively parsed from the remote service.
- Programmed resilient fallback loops explicitly grabbing remote base64 PDF text transcripts when descriptions ran short.

### 2. NLP Pre-Processor (`app/services/processor.py`)
- Engineered the initial keyword gatekeeping funnel explicitly designed to catch bills referencing animals, agriculture, or hunting before they trigger costly LLM calls.
- Enacts `NLTK`-powered linguistic tokenization and stemming logic, gracefully tumbling down to simple regex logic if the environment lacks NLTK dictionary definitions.
- Configured a weighted term-matching algorithm ensuring legislation passes the gateway *only* if matching two or more unique animal dictionary keywords, drastically reducing false positive API costs.

### 3. OpenRouter Intelligence Classification (`app/services/llm_scorer.py`)
- Integrated `gpt-4o-mini` utilizing OpenRouter endpoints for unparalleled speed and cost-effectiveness.
- Natively enforced 100% strict JSON schema extraction bounding output structure (`is_relevant`, `classification`, `score`, `reasoning`).
- Hand-crafted an exceptionally sharp System Prompt:
  - Defined absolute bounds for `PRO`, `ANTI`, and `NEUTRAL` classifications utilizing exhaustive inclusion boundaries (e.g. "banning animal cruelty", "ag-gag laws").
  - Included 6 distinct Few-Shot Calibration Examples natively in the prompt, anchoring the LLM to known ground-truth legal behaviors.
