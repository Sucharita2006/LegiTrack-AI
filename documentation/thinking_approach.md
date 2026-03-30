# Thinking, Approach, and Mission Behind LegiTrack AI

---

## The Problem I Set Out to Solve

Animal welfare in the United States is shaped — for better or worse — by **state-level legislation**. Every year, hundreds of bills are introduced across 50 state legislatures that directly affect factory farming regulations, wildlife protections, cruelty penalties, hunting permits, and veterinary oversight.

The challenge is that **no one is watching all of them**.

Large advocacy organizations like the ASPCA and Humane Society have dedicated lobbyists in a handful of states. But for the other 40+ states, critical bills routinely pass — or die — without any organized advocacy response. By the time a harmful bill surfaces in the news, it is often **already signed into law**.

The root cause is simple: **there is no automated, intelligent system** that monitors legislation across all states, understands whether a bill helps or hurts animal welfare, and ranks which bills demand immediate action.

That is the gap LegiTrack AI was designed to fill.

---

## Who Is This For?

LegiTrack AI is built for three primary users:

### 1. Advocacy Organizations
Groups like the ASPCA, Humane Society, Animal Legal Defense Fund, and state-level animal welfare nonprofits need to know **which bills to fight and which to support** — ideally before they reach a floor vote. LegiTrack AI gives them a prioritized, explainable feed of legislation ranked by urgency.

### 2. Legislative Staff and Policy Researchers
Congressional aides and policy analysts who track animal welfare portfolios need a tool that goes beyond keyword search. LegiTrack AI classifies the *intent* of a bill (does it protect animals or weaken protections?) and provides the reasoning behind that classification.

### 3. Informed Citizens and Journalists
Investigative journalists covering agriculture and environmental policy can use LegiTrack AI to quickly identify patterns — like a wave of anti-wildlife bills appearing simultaneously across multiple states, suggesting coordinated industry lobbying.

---

## How It Would Work in the Real World

In a production deployment, LegiTrack AI would operate as a **background intelligence service**:

1. **Automated Polling**: The APScheduler-driven backend would poll the Open States API every 6 hours, pulling newly introduced and recently updated bills across all 50 states.

2. **NLP Filtering**: Each bill passes through the NLTK keyword gate. Bills that contain no animal welfare vocabulary are silently discarded — saving LLM API costs and preventing noise.

3. **LLM Classification**: Bills that pass the keyword gate are sent to OpenRouter's `gpt-4o-mini` with a carefully calibrated few-shot prompt. The LLM returns a structured JSON response: `PRO`, `ANTI`, or `NEUTRAL`, along with a confidence score and natural language reasoning.

4. **Urgency Ranking**: The deterministic `RelevanceScorer` calculates a 0–100 priority score using three objective vectors (keywords, committee routing, sponsor history). If the LLM marked the bill as NEUTRAL, a 0.3x penalty dampens the score.

5. **Dashboard Consumption**: Advocacy staff open the dashboard each morning and see a ranked feed of legislation — sorted by urgency, filterable by state and stance, with transparent score breakdowns explaining exactly *why* each bill was flagged.

6. **Weekly Digest**: Every Monday, the system generates a Markdown/HTML digest summarizing the week's legislative activity — ready to email to board members, donors, or field advocates.

---

## The Key Architectural Decision: Why Decouple the Scoring?

The most important design decision in this project was **separating the LLM classification from the urgency scoring**.

### Why Not Let the LLM Do Everything?

It is tempting to ask the LLM a single question: *"How important is this bill for animal welfare on a scale of 0 to 100?"*

This approach fails for three reasons:

1. **LLMs are not calculators.** A language model that reads a bill about veterinary licensing boards might output a score of 85 simply because the text *sounds* important. It has no systematic way to weigh keyword density against committee routing against sponsor history. Its "scores" are linguistically plausible but mathematically inconsistent.

2. **LLM outputs are non-reproducible.** Run the same bill through the same LLM twice and you may get scores of 72 and 88. For an advocacy organization that must justify its priorities to a board of directors, this non-determinism is unacceptable.

3. **Black box scores erode trust.** If a lobbyist asks "why is this bill ranked #3?" and the answer is "the AI said so," the system has failed. Advocacy decisions require **transparent, auditable reasoning**.

### The Two-Tier Solution

LegiTrack AI addresses this by assigning each tier a role that matches its strengths:

* **The LLM handles semantics**: Understanding legislative language, interpreting intent, and distinguishing between a bill that *protects* endangered species and one that *removes* existing protections. This is a task that requires contextual reasoning — exactly what LLMs excel at.

* **The heuristic model handles math**: Counting keyword occurrences, looking up committee impact weights, querying the database for sponsor history. This is a task that requires deterministic calculation — exactly what LLMs are bad at.

The result is a system where:
- The *classification* (PRO/ANTI/NEUTRAL) comes from informed semantic reasoning
- The *urgency ranking* (0–100) comes from auditable, reproducible mathematics
- The *penalty dampening* cross-wires the two tiers, ensuring that neutral-classified bills don't get falsely high urgency scores

---

## Why This Architecture Matters Beyond Animal Welfare

The two-tier pattern — **LLM for context, heuristics for scoring** — is not specific to legislation tracking. It applies to any domain where you need both *understanding* and *prioritization*:

* **Cybersecurity**: Use an LLM to interpret the semantics of a threat report, then use a deterministic model to rank severity based on asset exposure and patch availability.
* **Healthcare**: Use an LLM to extract diagnoses from clinical notes, then use a scoring engine to triage patients by acuity.
* **Finance**: Use an LLM to summarize earnings call transcripts, then use a quantitative model to rank investment opportunities.

The core insight is the same: **LLMs are powerful semantic engines, but they should not be trusted with mathematical ranking.** Separating these responsibilities produces systems that are both intelligent and reliable.

---

## What I Learned Building This

### 1. Prompt Engineering Is Software Engineering
The few-shot calibration examples in `llm_scorer.py` were not written once — they were iteratively refined through dozens of test runs. Small changes in prompt phrasing ("classify the impact" vs. "classify the stance") produced dramatically different outputs. Effective prompt engineering requires the same rigor as writing test cases.

### 2. Cost Optimization Is a Design Constraint
Every LLM API call costs money. The NLTK keyword gate isn't just a nice-to-have — it's a **cost control mechanism** that reduces API usage by 60–80%. In a production system processing thousands of bills, this is the difference between a $50/month API bill and a $500/month one.

### 3. Transparency Is a Feature
The segmented relevance bar with hover tooltips was one of the most impactful UI decisions. When users can see *exactly* why a bill scored 87/100 (42 pts Keywords + 30 pts Committee + 15 pts Sponsor), they trust the system. When they see a red "Stance Penalty: -70%" on a neutral bill, they understand *why* it was deprioritized. This transparency converts skeptics into advocates.

### 4. The Frontend Is the Product
A powerful backend pipeline means nothing if the dashboard is confusing. The glassmorphic design, animated transitions, and bento-grid layout aren't decorative — they make complex legislative data **scannable and actionable** for non-technical users who need to make fast decisions.

---

## Mission

LegiTrack AI exists because **animals cannot lobby for themselves**.

The organizations that advocate on their behalf are often underfunded, understaffed, and overwhelmed by the sheer volume of legislation they need to monitor. If a single tool can help them identify the most critical bills faster, prioritize their limited resources better, and explain their advocacy decisions more transparently — then it was worth building.

That is the mission behind LegiTrack AI.
