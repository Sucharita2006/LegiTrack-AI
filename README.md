# Animal Legislation Tracker

A production-grade, full-stack intelligence system that actively monitors US state legislation, pipelines bills through NLP filtering, classifies protections natively via OpenRouter LLMs, and presents an interactive glassmorphic dashboard for analytical tracking.

## Architecture

```mermaid
graph LR
A[Open States API] --> B[Fetcher]
B --> C[Processor (NLP)]
C -->|If Relevant| D[LLM (gpt-4o-mini)]
D --> E[Scorer]
E --> F[SQLite DB]
F --> G[FastAPI]
G --> H[React Vite Dashboard]
```

## Features

- **Automated Open States Polling**: Directly ingests active legislation.
- **Deep LLM Classification**: Distinguishes PRO, ANTI, and NEUTRAL stances using highly tuned few-shot prompts mapping severe confidence impacts.
- **Granular Dashboard**: Analyzes metrics natively via Recharts with Bento-Grid data presentation.
- **Real-Time Execution Overlay**: Scopes pipeline state maps via floating Action bar prompts natively triggering `total_new` push hooks.
- **Bulk Action UI**: Supports `CheckAll` grid logic and 48hr `New Arrival` amber temporal badges natively appended across active filtering feeds.

## Quick Start

### 1. Configure Environment
```bash
cp .env.example .env
# Edit .env and supply keys: OPENSTATES_API_KEY, OPENROUTER_API_KEY
```

### 2. Backend Boot
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Execution
```bash
cd frontend
npm install
npm run dev
```

### 4. Pipeline Sync
Manually tap the `Run Pipeline` modal in the Dashboard Navbar, targeting specifically active States.

## Sub-Documentation

Refer to the `/documentation` directory for deep-dive architectural phases:

1. `phase1_backend.md`
2. `phase2_llm_pipeline.md`
3. `phase3_frontend_foundation.md`
4. `phase4_dashboard.md`
5. `phase5_bill_management.md`
6. `phase6_deployment.md`

## License
MIT
