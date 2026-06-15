/* ── Agent store ───────────────────────────────────────────────────
   Session persistence for agents built with the voice builder, so
   they show up like conversations in a chat app: in the sidebar's
   "Your agents", at the top of the Voice Agents list, and reopenable
   with their full config. localStorage-backed, plain pub/sub +
   useSyncExternalStore — no state library for a prototype. */

import { useSyncExternalStore } from 'react'
import type { KnowledgeDoc } from './agentDraft'
import type { AgentFlow } from './agentFlow'

export interface StoredAgent {
  id: string
  name: string
  systemPrompt: string
  initialMessage: string
  voiceId: string | null
  knowledge: KnowledgeDoc[]
  flow: AgentFlow | null
  updatedAt: number
}

const STORAGE_KEY = 'cartesia-proto-agents-v1'

function load(): StoredAgent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as StoredAgent[]) : []
  } catch (err) {
    console.error('Agent store load failed:', err)
    return []
  }
}

let agents: StoredAgent[] = load()
const listeners = new Set<() => void>()

function commit(next: StoredAgent[]) {
  agents = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (err) {
    console.error('Agent store save failed:', err)
  }
  listeners.forEach(l => l())
}

export function getAgent(id: string): StoredAgent | undefined {
  return agents.find(a => a.id === id)
}

/** Insert or replace by id; newest first. */
export function upsertAgent(agent: Omit<StoredAgent, 'updatedAt'>): void {
  const next: StoredAgent = { ...agent, updatedAt: Date.now() }
  commit([next, ...agents.filter(a => a.id !== agent.id)])
}

export function removeAgent(id: string): void {
  commit(agents.filter(a => a.id !== id))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Reactive list of built agents, newest first. */
export function useAgentStore(): StoredAgent[] {
  return useSyncExternalStore(subscribe, () => agents)
}
