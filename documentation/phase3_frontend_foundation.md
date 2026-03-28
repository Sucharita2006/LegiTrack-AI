# Phase 3: Frontend Foundation

## Overview
This phase established the infrastructure for a modern, production-ready frontend experience driven by React.

## Key Components

### 1. Toolchain Integration
- Scaffolded using Vite enabling lightning-fast HMR builds for `React + TypeScript`.
- Configured path aliases (`@/`) inside `vite.config.ts` and `tsconfig.json` ensuring clean import paths.
- Bootstrapped Tailwind CSS v4 in `index.css` via the new CSS module standard `@import "tailwindcss"`.

### 2. UI System Foundation
- Integrated custom `lucide-react` icons and `recharts` for dashboard charts.
- Overrode deep Tailwind behaviors in `index.css` introducing robust CSS tokens for `dark mode`, `glassmorphism`, `gradients`, and specifically requested UI palette behaviors (`--color-pro`, `--color-anti`, `--color-accent`).

### 3. Service Layer Integration (`frontend/src/services/api.ts`)
- Established types heavily enforcing database structures matched from Python.
- Built reusable export functions (`fetchStats`, `fetchBills`, `runPipeline`, `deleteBills`) communicating with the FastAPI root server port using cross-origin requests enabled on local networks.
- Enforced strict Type definitions encapsulating the pipeline total insertions (`total_new`) representing differential row logic.

### 4. Layout Abstraction
- Defined an overarching `Layout.tsx`.
- Integrated an intelligent `Navbar.tsx` acting as the global wrapper, managing responsive navigation routes and retaining the floating dynamic 'Run Pipeline' control button.
