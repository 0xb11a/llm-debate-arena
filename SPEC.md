# LLM Debate Arena — Project Specification

## Overview

A web-based platform where 2-6 AI models debate a topic starting from neutral positions, developing their own stances organically. A separate model (or one of the debaters) acts as judge. All model calls go through OpenRouter's unified API. Models are fetched dynamically from the OpenRouter catalog.

---

## Core Concept

- Assigns **no positions** — all agents start neutral
- Models form opinions **organically** through reasoning
- Agents may **agree, partially agree, or fully disagree** with each other
- Positions can **evolve** across rounds
- A separate judge scores on multiple dimensions
- Each agent has **editable instructions** that shape their debating personality

---

## Supported Models

All models available on OpenRouter are supported. The app fetches the full model catalog from `/api/v1/models` after API key validation. Each model gets:

- **Avatar**: Determined by provider (e.g., OpenAI = ⚡, Anthropic = ✦, xAI = 𝕏)
- **Color**: Deterministic hash from model ID to a 12-color palette
- **Personality**: Provider-based default (editable per-agent in the UI)

---

## User Flow

### 1. API Key Entry
- User enters OpenRouter API key
- Key stored in browser only (localStorage)
- Validate with `/api/v1/models` call — also fetches available models
- On success, proceed to setup with full model catalog

### 2. Debate Configuration
- **Topic input**: Free text field + suggested topic chips
- **2-6 Debater slots**: Each selects from searchable dropdown (no duplicates among debaters)
- **Judge slot**: Any model (can overlap with a debater)
- **Per-agent instructions**: Editable via `{}` modal button next to each model selector
- **Round count**: 1–5 (default: 3)

### 3. Debate Execution
- Turn order per round: Debater 1 → Debater 2 → ... → Debater N
- Each debater sees the full transcript so far
- Responses stream in real-time (SSE streaming via OpenRouter)
- Show typing indicator with model name/avatar while waiting

### 4. Judging
- After all rounds complete, judge model receives full transcript
- Judge scores each participant and declares winner
- Judge output streams in real-time

### 5. Post-Debate
- "New Debate" resets to configuration
- Export transcript to clipboard as markdown

---

## Prompt Architecture

### Debater System Prompt Template

```
You are {model_name}, participating in a {N}-way intellectual debate with {other_names}.

The topic is: "{topic}"

Your debating personality: {editable_instruction}

RULES:
- Start from a NEUTRAL position. Form your OWN genuine perspective based on reasoning.
- You may agree, partially agree, or fully disagree with others — follow your reasoning.
- Don't be contrarian for show, but don't be agreeable to be polite. Pursue truth.
- Directly engage with specific points others made. Reference their arguments.
- If your position evolves across rounds, acknowledge it openly.
- This is round {N} of {total}. 2-3 focused paragraphs. No meta-commentary — argue substantively.
```

### Debater User Message

**Round 1 (first speaker)**:
```
The topic is: "{topic}"
You speak first. Present your initial position.
```

**All other turns**:
```
Debate transcript so far:

{full_transcript}

Your turn — round {N}.
```

### Judge System Prompt

```
You are {judge_model_name}. {editable_judge_instruction}
```

### Judge User Message

```
Topic: "{topic}"
Participants: {name_1}, {name_2}, ..., {name_N}

Full transcript:

{full_transcript}

---

Score each participant (1-10):
• Position Clarity — Did they develop a clear, coherent stance?
• Argument Depth — Quality of reasoning, evidence, and insight
• Engagement — How well did they respond to and build on others' points?
• Intellectual Honesty — Did they acknowledge good opposing points? Evolve their thinking?

[Scoring format for each participant]

**Most Compelling Debater**: [Name]
**Best Single Argument**: [which argument from whom was most powerful]
**Analysis**: [4-5 sentences on debate dynamics]
```

---

## Transcript Format

Each entry in the running transcript sent to models:

```
[{Model Name} — Round {N}]:
{response text}
```

---

## API Integration

### OpenRouter Chat Completions

**Endpoint**: `POST https://openrouter.ai/api/v1/chat/completions`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {api_key}
HTTP-Referer: {app_url}
X-Title: LLM Debate Arena
```

**Request body**:
```json
{
  "model": "{openrouter_model_id}",
  "max_tokens": 1024,
  "stream": true,
  "messages": [
    { "role": "system", "content": "{system_prompt}" },
    { "role": "user", "content": "{user_message}" }
  ]
}
```

**Streaming**: Use `stream: true` and parse SSE chunks. Each chunk contains a `delta.content` field with partial text.

**Error handling**:
- 401 → Invalid API key
- 402 → Insufficient credits
- 429 → Rate limited (implement exponential backoff)
- 503 → Model temporarily unavailable

### OpenRouter Models List

**Endpoint**: `GET https://openrouter.ai/api/v1/models`

Used for API key validation and fetching available models. Returns `{ data: [{ id, name, ... }] }`.

---

## Tech Stack

```
Framework:    Next.js 16 (App Router, static export)
Language:     TypeScript
Styling:      Tailwind CSS v4
State:        React 19 + useReducer for debate state machine
Streaming:    Native fetch + ReadableStream
Storage:      localStorage for API key
Deployment:   GitHub Pages (static export)
Node:         >=22 (see .nvmrc)
```

---

## UI Design

### Visual Identity
- Light/dark theme with toggle (system preference default)
- Monospace font (IBM Plex Mono)
- Each model has a provider-based avatar emoji and deterministic color
- Dot-grid subtle pattern background
- Theme driven by CSS custom properties (`--ink-color`, `--paper-color`)

### Theme System
- Light (default): dark ink on light paper
- Dark: light ink on dark paper
- Toggle persisted in localStorage, system preference as fallback
- Inline `<head>` script prevents flash of wrong theme

### Model Selection
- Searchable dropdown selects (not cards)
- Filter by name, provider, or model ID
- Disabled items for already-selected debaters
- `{}` button next to each select opens instruction editor modal

### Layout (Setup Screen)
```
┌──────────────────────────────────┐
│        LLM DEBATE ARENA     [☀] │
│  N agents · neutral · no sides   │
├──────────────────────────────────┤
│  TOPIC: [________________________]│
│  [chip] [chip] [chip] [chip]...  │
├──────────────────────────────────┤
│  1. [▾ model select ▾]  {} ×    │
│  2. [▾ model select ▾]  {} ×    │
│  [+ Add Debater]                 │
├──────────────────────────────────┤
│  JUDGE: [▾ model select ▾]  {}  │
│  ROUNDS: [1] [2] [3] [4] [5]    │
├──────────────────────────────────┤
│  [======= BEGIN DEBATE ⚔️ ======]│
└──────────────────────────────────┘
```

### Layout (Debate View)
```
┌──────────────────────────────────┐
│ "Topic here"                     │
│ ⚡ GPT · ✦ Sonnet · ◆ Opus · ⚖️ │
├──────────────────────────────────┤
│ ┌─ ⚡ GPT-5.4 Pro ──────── R1 ─┐│
│ │ Response text...               ││
│ └────────────────────────────────┘│
│ ┌─ ✦ Claude Sonnet 4.6 ─── R1 ─┐│
│ │ Response text...               ││
│ └────────────────────────────────┘│
│                                  │
│    ◆ Claude Opus 4.6 is thinking…│
│                                  │
│ ┌─ ⚖️ VERDICT ─────────────────┐│
│ │ Scores + winner + analysis     ││
│ └────────────────────────────────┘│
│                    [NEW DEBATE]  │
└──────────────────────────────────┘
```

### Animations
- Entries slide up on appear (translateY + opacity)
- Thinking indicator pulses
- Topic chips highlight on select

---

## State Machine

```
SETUP ──[begin]──▸ DEBATING ──[all rounds done]──▸ JUDGING ──[verdict received]──▸ DONE
  ▴                    │                              │                             │
  └────────────────────┴──────────────────────────────┴─────────[reset]─────────────┘
```

### Debate State Shape

```typescript
interface DebateState {
  phase: "setup" | "debating" | "judging" | "done";
  config: {
    topic: string;
    rounds: number;
    debaters: string[];
    instructions: string[];
    judge: string;
    judgeInstruction: string;
  };
  entries: DebateEntry[];
  currentSpeaker: string | null;
  verdict: string | null;
  error: string | null;
}

interface DebateEntry {
  modelKey: string;
  round: number;
  text: string;
  timestamp: number;
}
```

---

## Suggested Topics (Defaults)

1. How should humanity govern superintelligent AI?
2. What is the ideal economic system for 2050?
3. Should humans colonize Mars?
4. What is consciousness?
5. How should we handle deepfakes?
6. Is privacy still possible in the digital age?
7. What role should religion play in modern society?
8. How should we restructure education for the AI era?
9. The right balance between free speech and safety
10. How should we approach human genetic engineering?

---

## File Structure

```
llm-debate-arena/
├── .github/workflows/
│   └── deploy.yml              # GitHub Pages deployment
├── src/
│   ├── app/
│   │   ├── page.tsx            # Main page — routes setup/debate/key
│   │   ├── layout.tsx          # Root layout + theme script
│   │   └── globals.css         # Theme variables, fonts, animations
│   ├── components/
│   │   ├── ApiKeyGate.tsx      # Key entry + model fetching
│   │   ├── DebateSetup.tsx     # Topic + model selection + config
│   │   ├── DebateView.tsx      # Live debate feed
│   │   ├── DebateEntry.tsx     # Single response bubble
│   │   ├── VerdictCard.tsx     # Judge verdict display
│   │   ├── ModelSelect.tsx     # Searchable model dropdown
│   │   ├── InstructionModal.tsx # Agent instruction editor
│   │   ├── TopicChip.tsx       # Suggested topic button
│   │   └── ThemeToggle.tsx     # Light/dark toggle
│   ├── lib/
│   │   ├── models.ts           # Model utilities (color, avatar, personality)
│   │   ├── openrouter.ts       # API client (streaming + model fetch)
│   │   ├── prompts.ts          # Prompt template builders
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── debate-engine.ts    # Core debate orchestration
│   └── hooks/
│       └── useDebate.ts        # Debate state machine hook
├── .nvmrc                      # Node 22
├── next.config.ts              # Static export config
├── package.json
├── tsconfig.json
├── SPEC.md                     # This file
├── CLAUDE.md                   # Project context for Claude Code
└── README.md
```

---

## Key Implementation Notes

1. **Streaming is critical** — debates can take 30-60s per response. Without streaming, the UI feels dead. Use `stream: true` and render tokens as they arrive.

2. **Abort support** — user can cancel mid-debate. Uses `AbortController` on fetch calls.

3. **Transcript management** — the full transcript grows large over rounds. Monitor token counts for long debates.

4. **Error resilience** — if one model call fails, show the error inline.

5. **Rate limiting** — 500ms delay between sequential API calls to avoid OpenRouter rate limits.

6. **No backend** — all API calls go directly from browser to OpenRouter. No server-side code.

7. **Static export** — deployed as static files to GitHub Pages. No SSR, no API routes.

---

## Future Enhancements (v2+)

- **Audience voting**: Users vote on each round
- **Multi-judge panel**: 2-3 judges deliberate independently
- **Debate history**: Save/load past debates from localStorage
- **Share links**: Generate shareable URLs with embedded transcript
- **Token/cost tracker**: Show per-model token usage and estimated cost
- **Streaming markdown**: Render markdown as it streams in
- **Tournament bracket**: Multiple debates feed into semifinals/finals
