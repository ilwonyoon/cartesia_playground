/* ── Agent draft model ─────────────────────────────────────────────
   The mutable-looking but immutable state the voice builder fills in
   as the conversation progresses. Every field starts null ("not yet
   designed") so the panel can render placeholders that fill in live. */

import type { AgentFlow } from './agentFlow'

/** A knowledge-base document extracted from the conversation. */
export interface KnowledgeDoc {
  title: string
  content: string
}

export interface AgentDraft {
  name: string | null
  useCase: string | null
  language: string | null
  /** Catalog id from `data/voices.ts` (e.g. "v3"), not a raw Cartesia id. */
  voiceId: string | null
  systemPrompt: string | null
  initialMessage: string | null
  /** Facts live here, behavior lives in the system prompt. */
  knowledge: KnowledgeDoc[]
  /** How the call moves — nodes and conditioned edges. */
  flow: AgentFlow | null
}

export type DraftPatch = Partial<{
  name: string
  useCase: string
  language: string
  voiceId: string
  systemPrompt: string
  initialMessage: string
  /** Docs to create or update — matched to existing docs by title. */
  knowledge: KnowledgeDoc[]
  /** Full replacement of the call flow. */
  flow: AgentFlow
}>

export const EMPTY_DRAFT: AgentDraft = {
  name: null,
  useCase: null,
  language: null,
  voiceId: null,
  systemPrompt: null,
  initialMessage: null,
  knowledge: [],
  flow: null,
}

/** Upsert incoming docs into the list by title (case-insensitive). */
export function upsertDocs(existing: KnowledgeDoc[], incoming: KnowledgeDoc[]): KnowledgeDoc[] {
  const byTitle = new Map(existing.map(d => [d.title.toLowerCase(), d]))
  incoming.forEach(d => byTitle.set(d.title.toLowerCase(), d))
  return [...byTitle.values()]
}

/** Merge a patch into a draft, ignoring undefined fields. Returns a new object. */
export function applyPatch(draft: AgentDraft, patch: DraftPatch): AgentDraft {
  return {
    name: patch.name ?? draft.name,
    useCase: patch.useCase ?? draft.useCase,
    language: patch.language ?? draft.language,
    voiceId: patch.voiceId ?? draft.voiceId,
    systemPrompt: patch.systemPrompt ?? draft.systemPrompt,
    initialMessage: patch.initialMessage ?? draft.initialMessage,
    knowledge: patch.knowledge ? upsertDocs(draft.knowledge, patch.knowledge) : draft.knowledge,
    flow: patch.flow ?? draft.flow,
  }
}

/** The draft can be turned into a real agent once the essentials exist. */
export function draftReady(draft: AgentDraft): boolean {
  return Boolean(draft.name && draft.voiceId && draft.systemPrompt && draft.initialMessage)
}
