# Phase 6: Final Bug Fixes and Decoupled Relevance Score

**Date Commenced:** March 30, 2026

## Overview

In the final phase of the Animal Legislation Tracker project, the focus shifted from foundational data ingestion and semantic analysis to **mathematical urgency prioritization**. 

While the OpenRouter LLM was successfully implemented in Phase 3 to classify the semantic *stance* of a bill (PRO, ANTI, NEUTRAL), it became clear that an LLM cannot be trusted to deterministically calculate a reliable "urgency" or "relevance" score using complex quantitative metadata like committee assignments and keyword density.

To solve this, a **Two-Tier NLP Architecture** was implemented, decoupling the Stance Classification from a newly introduced Algorithmic Relevance Scoring Model. 

## The Relevance Score Algorithm (`RelevanceScorer`) 

### Why Decouple the Scoring?
1. **Mathematical Inconsistency:** LLMs are linguistic engines, not calculators. Asking an LLM to accurately weigh keyword density against a historical sponsor index across hundreds of varied legislative texts results in hallucinated or subjective scoring.
2. **Transparency:** Advocacy organizations cannot act on a "black box" 85/100 score. They need to know exactly *why* a bill was flagged as extremely urgent so they can justify mobilizing resources.

### Implementation Details
We built a purely deterministic Python class (`app/services/relevance.py`) that calculates a strict 0-100 `relevance_score` at the ingestion pipeline layer. The algorithm evaluates three primary vectors:

1. **Keyword Density (Max 40 Pts):** A quantitative assessment of how heavily the bill's text relies on our target animal welfare vocabulary (e.g., "veterinary," "livestock").
2. **Committee Impact (Max 30 Pts):** A routing assessment. Bills sent to "Agriculture" or "Natural Resources" committees gain maximum urgency points due to their historically severe impact on animal policy.
3. **Sponsor Track Record (Max 30 Pts):** A historical database lookup. If the bill's sponsor has previously filed other animal-related legislation in our system, the bill is flagged as a higher priority.

### The Stance-Based Penalty Dampener
To prevent false-positive red alerts, the algorithm was cross-wired with the LLM's classification output. If the RelevanceScorer mathematically calculates a 100/100 score (e.g., an extremely dense administrative bill about veterinary advisory boards), but the LLM classifies the bill's actual effect as **NEUTRAL**, the algorithm applies an automatic **0.3x multiplier penalty**, slashing the urgency score by 70%.

## UI Integration & Final Bug Fixes

To visualize this transparency, the React frontend (`RelevanceBar` component) was refactored:
- **Segmented Proportions:** The visual progress bar was split into three distinct color-coded segments representing Keyword, Committee, and Sponsor points. The math was scaled so the individual segments perfectly equal the final total score visually.
- **Analytical Tooltips:** A hover-tooltip was engineered to intercept the `relevance_breakdown` JSON from the FastApi backend, allowing the end-user to explicitly read the mathematical breakdown of the score, including any explicitly surfaced red Stance Penalties.

## Final Evaluation
The classification engine was tested using a local evaluation script against a manually verified subset of bills across overlapping states. The integration of Few-Shot Prompting combined with the Decoupled Relevance Scorer successfully satisfied all primary architectural requirements.
