/* ── Flow tracer ───────────────────────────────────────────────────
   Run-time observability for the Flow view: after each agent turn in
   a preview call, classify where the conversation sits on the flow
   graph — and flag deviations when the agent does something the
   design doesn't cover. Claude Haiku: it's a fast classification,
   not a reasoning task. Tracing must never break the call, so every
   failure degrades to "no trace". */

import type { AgentFlow } from './agentFlow'

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
const TRACER_MODEL = 'claude-haiku-4-5'

export interface TraceTurn {
  role: 'agent' | 'user'
  content: string
}

export interface TraceResult {
  nodeId: string | null
  deviation: string | null
}

const TRACE_TOOL = {
  name: 'trace_call',
  description: 'Place the live call on the flow graph and flag deviations.',
  input_schema: {
    type: 'object',
    properties: {
      node_id: {
        type: ['string', 'null'],
        description: "The id of the flow node that best matches the agent's LATEST turn; null only if nothing fits.",
      },
      deviation: {
        type: ['string', 'null'],
        description: "One short sentence ONLY if the agent's latest turn contradicts a node instruction or edge condition, or does something the flow does not cover. Otherwise null.",
      },
    },
    required: ['node_id', 'deviation'],
    additionalProperties: false,
  },
} as const

const SYSTEM_PROMPT = `You map a live voice call onto its designed flow graph.

You receive the flow (nodes with instructions, edges with natural-language conditions) and the latest transcript turns. Decide which node the agent is currently executing, judged by the agent's LATEST turn.

- node_id: the single best-matching node id, exactly as given. Use null only when nothing fits at all.
- deviation: null in the normal case. Set one short sentence only when the agent's latest turn breaks the design — it contradicts a node instruction, takes a path no edge condition allows, skips a required step (like verification), or claims a capability the flow doesn't have. Stylistic variation is NOT a deviation.`

/** Classify the call's current flow position. Never throws. */
export async function traceCall(flow: AgentFlow, turns: TraceTurn[]): Promise<TraceResult> {
  const empty: TraceResult = { nodeId: null, deviation: null }
  if (!ANTHROPIC_API_KEY || turns.length === 0) return empty

  const transcript = turns
    .map(t => `${t.role === 'agent' ? 'AGENT' : 'CALLER'}: ${t.content}`)
    .join('\n')

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: TRACER_MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Flow graph:\n${JSON.stringify(flow)}\n\nLatest transcript:\n${transcript}`,
        }],
        tools: [TRACE_TOOL],
        tool_choice: { type: 'tool', name: 'trace_call' },
      }),
    })
    if (!res.ok) {
      console.error('Flow tracer API error:', res.status, await res.text().catch(() => ''))
      return empty
    }
    const data = await res.json() as { content?: { type: string; input?: { node_id?: string | null; deviation?: string | null } }[] }
    const input = data.content?.find(b => b.type === 'tool_use')?.input
    if (!input) return empty
    const nodeId = typeof input.node_id === 'string' && flow.nodes.some(n => n.id === input.node_id)
      ? input.node_id
      : null
    const deviation = typeof input.deviation === 'string' && input.deviation ? input.deviation : null
    return { nodeId, deviation }
  } catch (err) {
    console.error('Flow tracer failed:', err)
    return empty
  }
}
