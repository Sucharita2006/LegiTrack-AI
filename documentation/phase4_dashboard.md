# Phase 4: Dashboard & Data Visualizations

## Overview
This phase mapped the architecture of the primary consumer-facing portals built inside the React application layout.

## Key Components

### 1. The Global Dashboard (`frontend/src/pages/Dashboard.tsx`)
- Constructed utilizing the "Web3 Landing" hero snippet logic, featuring animated background gradients, loading pulse columns, and an aesthetic glass container logic layout.
- Integrates `Recharts` dynamically, populating charts directly fueled by `GET /api/stats`.
- Added Bento-Grid style `StatCards` separating the pipeline output into PRO, ANTI, and NEUTRAL visual slices.

### 2. Live Newsletter Preview (`frontend/src/pages/Digest.tsx`)
- Uses React States and `iframe / pre` swapping techniques to let consumers preview either the compiled `HTML` rendering or `Markdown` rendering of the weekly digest directly through their browser, enabling immediate copy-code downloads.

### 3. Score Deep-Dive Detail Page (`frontend/src/pages/BillDetail.tsx`)
- Engineered a focused `/bills/:id` detailed routing architecture.
- Maps verbose JSON AI-reasoning directly alongside `Confidence` and `Keyword Score` data fields providing transparency inside a dedicated view block.
- Implements a programmatic link enabling the user to natively leave the instance traversing directly to the raw OpenStates source structure.
