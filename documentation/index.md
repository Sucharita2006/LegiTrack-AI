# Animal Legislation Tracker Documentation

Welcome to the internal documentation for the Animal Legislation Tracker project. This directory contains detailed explanations of the work completed across all major architectural phases of development.

## Project Phases

- [Phase 1: Backend Architecture & APIs](phase1_backend.md)
  *FastAPI setup, async SQLite configuration, SQLAlchemy ORM Models, and RESTful endpoints.*

- [Phase 2: LLM Intelligence Pipeline](phase2_llm_pipeline.md)
  *Open States API ingestion, NLP keyword filtering, and OpenRouter (GPT-4o-mini) classification.*

- [Phase 3: Frontend Foundation](phase3_frontend_foundation.md)
  *React + TypeScript + Vite initialization, intelligent API service layer, and Tailwind CSS v4 UI foundation.*

- [Phase 4: Dashboard & Data Visualizations](phase4_dashboard.md)
  *Global Dashboard with Recharts, interactive Bills feed, detail deep-dives, and Weekly Digest generation.*

- [Phase 5: Interactive Bill Curation](phase5_bill_management.md)
  *Robust bill curation featuring glassmorphic checkboxes, bulk deletions, pipeline overlays, and "New Arrival" badging.*

- [Phase 6: Decoupled Relevance Score](phase6_final_bug_fixes_and_relevance_score.md)
  *Decoupled 100-point algorithm determining urgency via Keyword Density, Committees, and Sponsor History.*

---

- [Thinking, Approach & Mission](thinking_approach.md)
  *The product vision, user personas, real-world deployment model, and the architectural rationale behind decoupling LLM classification from deterministic scoring.*

