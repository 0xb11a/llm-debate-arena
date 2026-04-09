# LLM Debate Arena

## Quick Start

```bash
nvm use 22
npm install
npm run dev       # http://localhost:3000
npm run build     # static export to /out
```

## Tech Stack

- **Next.js 16** (App Router, static export for GitHub Pages)
- **React 19**, **TypeScript**, **Tailwind CSS v4**
- **Node >=22** (see `.nvmrc`)
- No backend — all API calls go from browser directly to OpenRouter

## Architecture

### State Flow

`ApiKeyGate` → validates key + fetches models → `DebateSetup` → configures debate → `DebateView` → streams responses

### Key Directories

- `src/lib/` — Core logic (types, API client, prompt builders, debate engine, model utilities)
- `src/hooks/` — `useDebate` hook manages state via `useReducer`
- `src/components/` — All UI components (client-side only)

### Theme System

CSS custom properties `--ink-color` and `--paper-color` drive all colors. Components use Tailwind's `ink` and `paper` color tokens (e.g., `text-ink/40`, `bg-paper`). Toggle via `.dark` class on `<html>`.

### Models

Models are fetched dynamically from OpenRouter's `/api/v1/models` endpoint. The `buildModelDef()` function in `src/lib/models.ts` assigns deterministic colors (hash-based), provider avatars, and default personalities.

## Deployment

Static export deployed to GitHub Pages via `.github/workflows/deploy.yml`. The `basePath` is set to `/llm-debate-arena` in `next.config.ts`.

## Spec

See `SPEC.md` for full project specification.
