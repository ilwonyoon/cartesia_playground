# Cartesia Take-Home Exercise — Product Design Lead

**Role:** Product Design Lead  
**Budget:** 4–5 hours total  
**Due:** ~end of sprint (scope accordingly)

---

## Overview

Two-part exercise: a competitive teardown and a concept design exploration.
No trick questions — evaluating taste, craft, and product thinking.
AI tools (Claude, Cursor, etc.) are encouraged; tooling fluency is part of the signal.

---

## Part 1: Competitive Teardown (~30 min)

Pick **one** competitor's developer-facing product surface:

- ElevenLabs (elevenlabs.io)
- Deepgram (deepgram.com)
- Inworld (inworld.ai)

Compare it against Cartesia's console and playground: `console.cartesia.ai`

For each of **1–3 things the competitor does better**, document:

1. **What they do** — annotated screenshots preferred
2. **Why it's better** — what user need it serves, what interaction pattern/design decision makes it work
3. **How to apply it to Cartesia** — concrete suggestion

Keep it concise. A few annotated screenshots with short commentary is the ideal format — no deck needed.

---

## Part 2: Concept Car — "Give Your Agent a Face" (~3.5–4 hrs)

### Context

Voice agents are increasingly deployed in customer-facing contexts (support, sales, onboarding, education). This concept explores an **optional visual avatar layer** attachable to an existing Cartesia Agent:

- Upload a single image (photo, illustration, or character)
- Cartesia generates a real-time animated avatar that speaks and reacts in sync with the agent's voice
- Output: an embeddable widget deployable to a website

### Scope — Core Flow (5 steps)

| Step | Description |
|------|-------------|
| 1 | **Start**: User is on an existing Cartesia Agent in the console |
| 2 | **Upload**: Choose/upload an avatar image (photo, illustration, or character) |
| 3 | **Configure**: Set avatar behavior — expressiveness, visual style, background, display settings |
| 4 | **Preview**: See and hear the avatar speaking in real time, driven by the existing agent |
| 5 | **Deploy**: Get an embed snippet or widget URL to drop into a website |

**Out of scope**: Agent creation, TTS/STT/LLM configuration, knowledge base setup — assume all of that already exists and works. Focus is the avatar layer only.

### Output Options

**Option A — Design deliverables:**
- High-fidelity visual designs on at least 2–3 key screens (show craft)
- Flow diagram or wireframe set showing the end-to-end journey (show thinking, not just hero screens)
- Ground in Cartesia's existing design language (console.cartesia.ai), but show where you'd push it

**Option B — Vibe-coded prototype (preferred by Cartesia):**
- Build using Cartesia's Line platform
- Avatar can be static (no lip-sync required), with a background with motion
- Communicates intent to engineers via working prototype rather than static screens

### Evaluation Criteria

| What they look for | What they don't want |
|---|---|
| Taste and visual sensibility | Pixel-perfect redesign of the entire console |
| Interaction design basics (happy path + basic edge cases) | Speculative features disconnected from core flow |
| Product instinct — right problems, smart scoping, opinions | Polished slide deck |

---

## Deliverables

1. **Designs** — Figma file, PDF, or the prototype itself
2. **Short writeup (~half page)** — key design decisions, tradeoffs, what you'd explore next with more time
3. **Optional Loom** — narrate rather than write if preferred

A 45-minute review session follows where you walk through the work and dig into details together.

---

## Time Budget Guidance

4–5 hours is sincere. A well-reasoned, well-crafted partial exploration beats a sprawling shallow one.
**Scoping decisions are part of the evaluation** — document what you prioritized and why.

This exercise maps directly to real work in the first 90 days.

---

## This Repo — Context

This repo (`/Users/ilwonyoon/Documents/Work_trials/Cartesia`) is a Python playground for the Cartesia API built to understand the platform firsthand while working on the exercise.

- **Stack:** Python 3.13 + `uv`, `cartesia` SDK v3 (`cartesia[websockets]==3.0.2`), `python-dotenv`
- **API key:** `.env` (gitignored), `CARTESIA_API_KEY`
- **Smoke test:** `uv run main.py`
- See `README.md` for example scripts (TTS, STT, voice listing)

The playground was built to develop firsthand familiarity with the Cartesia API surface — useful signal for grounding design decisions in technical reality.
