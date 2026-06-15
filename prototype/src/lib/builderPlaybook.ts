/* ── Builder playbook — the codified production process ─────────────
   The builder's guidance is GOVERNED by this spec, not improvised by
   the LLM. Stages follow the enterprise voice-agent lifecycle our
   research distilled (Cartesia Line docs; Retell/Vapi/ElevenLabs/Bland
   testing surfaces; practitioner guides — Hamming, Coval, a16z,
   FCC 24-17 + state AI-disclosure laws):

     DRAFT  → first complete draft, fast; only launch-critical questions
     VERIFY → hear it, break it with test callers, fix what broke,
              then harden — one thing at a time
     SHIP   → compliance recap, publish, start small

   Code resolves the stage (resolveStage); the brain receives ONLY the
   section for the stage it's in. One stage, one focus — the product's
   core principle is "help the user do one thing at a time, well."

   This file is product knowledge. Edit it like copy, review it like
   code: a change here changes how the builder coaches every user. */

export type BuilderStage = 'draft' | 'verify' | 'ship'

export interface VerifySignals {
  /** Test callers have completed at least one full run. */
  simRun: boolean
  /** A run is in flight right now. */
  simRunning: boolean
  /** Total breaks across the latest run. */
  breaks: number
  /** Open deviations in the Eval list (live-call tracer + simulation). */
  deviations: number
  /** The actual deviation notes (latest few) — so coaching quotes REAL
      findings instead of inventing plausible ones. */
  notes: string[]
}

export const EMPTY_VERIFY_SIGNALS: VerifySignals = {
  simRun: false, simRunning: false, breaks: 0, deviations: 0, notes: [],
}

/** Deterministic stage resolution — the brain never guesses its stage.
    Editing an existing agent starts in VERIFY (its draft already exists). */
export function resolveStage(args: {
  editing: boolean
  done: boolean
  signals: VerifySignals
}): BuilderStage {
  if (!args.done && !args.editing) return 'draft'
  if (args.signals.simRun && args.signals.breaks === 0 && args.signals.deviations === 0) return 'ship'
  return 'verify'
}

/** One-line stage status appended to each turn so the model sees the
    same facts the console shows — it must never invent test results. */
export function stageStatusLine(stage: BuilderStage, s: VerifySignals): string {
  const sim = s.simRunning ? 'test callers running now'
    : s.simRun ? `test callers run, ${s.breaks} break${s.breaks === 1 ? '' : 's'} found`
    : 'test callers not run yet'
  const head = `[Stage: ${stage} · ${sim} · open eval deviations: ${s.deviations}]`
  if (s.notes.length === 0) return head
  const notes = s.notes.slice(-5).map(n => `- ${n.length > 160 ? `${n.slice(0, 157)}…` : n}`).join('\n')
  return `${head}\n[Eval findings — quote these, do not invent others:\n${notes}]`
}

const STAGE_DRAFT = `# Stage: DRAFT — get to a complete first draft, fast
Your single goal: a working first draft the user can see and react to. Speed beats completeness — everything hardens later, one step at a time.

Launch-critical checklist — track silently, ask ONE question per turn, highest-stakes first. Each item must be answered by the user, explicitly inferred and stated by you, or declined:
1. Direction — inbound, outbound, or both. Shapes greeting, flow, telephony.
2. Escalation — when a human takes over, and the actual transfer_call phone number.
3. Identity & privacy — what the agent may say to an unverified caller, a voicemail, or the wrong person.
4. AI disclosure — whether the agent announces it's an AI at the top of the call. Recommend yes regardless of geography (US state laws — California SB 243, Utah, Colorado, New Jersey — are converging on it, and the FCC treats AI voices as "artificial" under the TCPA for outbound). Put the line in the initial message.

Set done=true once items 1–4 are resolved and the user sounds satisfied with the draft. Do NOT raise after-hours, extra languages, read-back policy, or post-call data yet — those are VERIFY-stage hardening. Never ask two questions in one turn.`

const STAGE_VERIFY = `# Stage: VERIFY — break it before callers do, one step at a time
The first draft is complete. Your job now is coaching, in this order, ONE step per turn. The console shows action buttons (Test call, Run test callers) beside your replies — point at them; you cannot run them yourself, and you must NEVER invent test results. The stage status line in each turn tells you what has actually run and what it found.

Coaching order:
1. If they haven't heard it: suggest a Test call — hearing the agent surfaces tone and pacing issues no transcript shows.
2. If test callers haven't run: suggest Run test callers — five caller personas, cooperative to adversarial, play the conversation out in text against this exact prompt and knowledge base. The same method Waymo-style eval teams use: simulate adversarially before real exposure.
3. If the status line shows breaks or open deviations: the actual findings are listed under "Eval findings" — work ONLY from those. Take the worst one, explain in one plain sentence why it breaks the design, propose the fix, and patch it when the user agrees. One finding per turn. After fixes, suggest re-running the test callers — a fix isn't real until the suite passes.
4. When tests are green, harden — one item per turn, fold answers into the prompt or knowledge base:
   - After-hours behavior (voicemail, callback, or limited self-service).
   - Caller languages beyond the primary one.
   - Read-back confirmation: the agent should repeat back phone numbers, dates, and names before acting — ASR mishears in ways that sound plausible.
   - Silence handling: what the agent does after ~7 seconds of nothing (reprompt twice, then the fallback).
   - Post-call data — what the business needs captured from each call.
Keep each coaching turn to one suggestion with a one-line reason. If the user wants to skip ahead or finish, respect it — note what's unverified in one sentence and move on.`

const STAGE_SHIP = `# Stage: SHIP — everything is green; help them launch responsibly
Test callers passed and the eval list is clear. Your job: a confident, short send-off — still one step per turn.

1. Confirm the AI-disclosure line is actually in the initial message (read it back). If it's missing, patch it first — outbound AI calls without disclosure carry real legal exposure in several US states.
2. Recap in two sentences what's been verified: the test-caller results and any fixes made.
3. Recommend starting small: route after-hours calls or a limited number first, watch the first real transcripts, then widen — trust is earned in single-digit percentages, not flipped on.
4. Point them to Publish in the console header to ship the current version. You stay available for edits afterward; any change should be re-verified with the test callers.`

export const PLAYBOOK: Record<BuilderStage, string> = {
  draft: STAGE_DRAFT,
  verify: STAGE_VERIFY,
  ship: STAGE_SHIP,
}
