# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A take-home exercise for a **Product Design Lead** role at Cartesia (see `TASK.md` for the full brief). Two parts: a competitive teardown, and a concept design — **"Give Your Agent a Face"**, an optional avatar layer for Cartesia Agents. Cartesia prefers a vibe-coded prototype over static screens, so the React app under `prototype/` is the primary deliverable, not throwaway scaffolding.

This is **not** a single application. It is four independent subprojects, each with its own toolchain. Work within one at a time; they do not import from each other.

| Dir | Stack | Role |
|-----|-------|------|
| `prototype/` | React 19 + Vite + Tailwind v4 + TS | **The deliverable.** A faithful reconstruction of the Cartesia console, the canvas for the avatar concept. |
| `cartesia_playground/` + `examples/` + `main.py` | Python 3.13 + `uv` + `cartesia` SDK v3 | API playground — built to ground design decisions in how the real API behaves (TTS/STT/voices). |
| `design-system/` | Markdown + JSON + CSS (extracted from Figma) | Source of truth for the visual language. Feeds `prototype`'s theme. |
| `markdown-preview/` | VitePress | Local doc viewer for reading the writeup/brief in the browser. |

## Commands

### prototype/ (the React app — most work happens here)
```bash
cd prototype
npm install
npm run dev      # Vite dev server (default http://localhost:5173)
npm run build    # tsc -b && vite build — run before declaring a build "done"; tsc is the real gate
npm run lint     # eslint .
```
There is no test runner configured in `prototype` — `npm run build` (which type-checks via `tsc -b`) and `npm run lint` are the verification gates.

### Python playground
```bash
uv sync                                   # creates .venv, installs deps
uv run main.py                            # connectivity smoke test (prints API version + 3 voices)
uv run examples/tts_to_file.py "text"     # one-shot TTS → output/tts_to_file.wav
uv run examples/tts_streaming.py          # streaming TTS over WebSocket
uv run examples/list_voices.py            # list account voices
uv run examples/stt_transcribe.py <file>  # transcribe an audio file
```
Requires `CARTESIA_API_KEY` in `.env` (gitignored; `cp .env.example .env`). Get a key at https://play.cartesia.ai/keys. There is no Python test suite — examples are run manually.

### markdown-preview/ (doc viewer)
```bash
cd markdown-preview
npm install
npm run dev      # VitePress, LAN-exposed
```

## Architecture notes that span files

### The design-token pipeline (read this before touching any styling)
The visual language flows in one direction:

`design-system/design-system.md` + `design-system/tokens.{json,css}` (extracted from Cartesia's Figma) → **`prototype/src/index.css` `@theme` block** → semantic Tailwind v4 utilities → components.

- Tailwind v4 has **no `tailwind.config.js`**. All design tokens live in the `@theme { … }` block in `prototype/src/index.css`. Adding a color/radius/font there is what makes utilities like `bg-bg-brand`, `text-text-secondary`, `rounded-2xl`, `font-serif` exist. To add a token, edit that block — there is no config file to touch.
- Tokens are layered: **primitives** (`--color-neutral-900`, `--color-brand`) → **semantic aliases** (`--color-text-primary`, `--color-bg-page`, `--color-border-default`). Prefer semantic utilities (`text-text-primary`) over primitive ones (`text-neutral-900`) in new component code — though existing pages mix both.
- **The single most important visual rule** (from `design-system.md`): every neutral gray is *warm* (beige/cream undertone), and `#004d22` forest green is the *only* accent color. Never introduce a cold gray (`#888`, `#f5f5f5`) or a second accent hue — it reads as foreign. Hierarchy comes from weight/size/opacity, not color. When adding UI for the avatar feature, reuse `brand-tint` (`#dbe6d0`) for highlights and `brand` for active icons rather than inventing colors.
- `design-system.md` ends with a concrete **"Implications for 'Give Your Agent a Face'"** section (new Avatar tab between Configuration/Deployment, wizard upload pattern, Beta badge convention). Treat it as the spec when building the concept.

### prototype routing & layout
- **No router despite `react-router-dom` being installed.** `src/App.tsx` does manual page switching via a `useState<Page>` string and a `switch`. Pages are added by adding a `case` there and a nav entry in `src/components/Sidebar.tsx`. Special sentinel pages use `__`-prefixed keys (e.g. `__design_system`).
- Every page renders inside `AppLayout` (`src/components/AppLayout.tsx`): fixed ~207px `Sidebar` + a centered `max-w-[896px]` main column. Layout dimensions are deliberately matched to Figma (see the comments in `AppLayout.tsx`); preserve them.
- `src/components/ui/` holds the reusable primitives (`Button`, `Card`, `Input`, `Toggle`, `Tabs`, `WizardShell`, etc.) modeled on `design-system.md`'s component catalog. `src/pages/` composes them. Reach for a `ui/` primitive before hand-rolling; some pages (e.g. `VoiceAgentsPage`) inline raw markup, but new shared UI belongs in `ui/`.
- Class composition uses `cn()` from `src/lib/utils.ts` (`clsx` + `tailwind-merge`). Use it for any conditional/merged className.
- Icons: product nav icons are hand-authored SVG components in `src/components/icons/index.tsx` (exact Figma paths, `currentColor`-driven, `size` prop). General-purpose icons come from `lucide-react`. Match the existing convention — don't mix a lucide icon into the nav.
- The Sidebar's org-switcher popover links out to `localhost:5181` (the `markdown-preview` viewer) for the brief/design-system docs — those are dev-only convenience links, not app features.

### Python playground
- All scripts get their client from `cartesia_playground/client.py` via `get_client()` (cached sync) / `get_async_client()` (async). It loads `CARTESIA_API_KEY` and fails loudly with an actionable message if missing. Shared defaults (`DEFAULT_MODEL_ID = "sonic-3"`, `DEFAULT_VOICE_ID`, `DEFAULT_OUTPUT_FORMAT` = WAV/`pcm_f32le`/44.1kHz) live there too — new example scripts should import these, not hardcode their own.
- Each file in `examples/` demonstrates exactly one capability and is independently runnable with `uv run`. Audio is written to `output/` (gitignored).

## Conventions

- Follow the user's global rules (immutability — never mutate, construct new objects; small focused files; comprehensive error handling; no stray `console.log`). These live in `~/.claude/rules/` and apply here.
- The prototype targets visual fidelity to Cartesia's console. When in doubt about a value (size, color, spacing, radius), the answer is in `design-system/design-system.md` — consult it rather than guessing.

## Heads-up

`design-system/run-extract.py` contains a **hardcoded Figma personal access token and file key** (committed in plaintext). It is a one-off scratch script for pulling Figma frames. Don't propagate that token elsewhere; if this repo is ever pushed to a public remote, that token should be rotated and removed first.
