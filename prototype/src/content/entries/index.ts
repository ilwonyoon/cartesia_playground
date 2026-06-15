import type { ContentEntry, Surface, Kind } from './types'
import { SHELL_ENTRIES } from './shell'
import { AGENTS_ENTRIES } from './agents'
import { BUILDER_ENTRIES } from './builder'
import { AGENT_SHELL_ENTRIES } from './agentShell'
import { FLOW_SIM_ENTRIES } from './flowSim'

export type { ContentEntry, Surface, Kind } from './types'

/** Keys are plain strings so surfaces can be migrated incrementally;
    t() falls back to the key itself, which makes typos visible in UI. */
export type ContentKey = string

export const CONTENT: ContentEntry[] = [
  ...SHELL_ENTRIES,
  ...AGENTS_ENTRIES,
  ...BUILDER_ENTRIES,
  ...AGENT_SHELL_ENTRIES,
  ...FLOW_SIM_ENTRIES,
]

export const CONTENT_BY_KEY: Record<ContentKey, ContentEntry> =
  Object.fromEntries(CONTENT.map(e => [e.key, e]))

export const SURFACES: Surface[] = [...new Set(CONTENT.map(e => e.surface))]
export const KINDS: Kind[] = [...new Set(CONTENT.map(e => e.kind))]
