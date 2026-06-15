/* ── Agent call flow — an OBSERVABILITY view, not a runtime ────────
   Line has no node engine: an agent is an introduction + a system
   prompt + tools (+ handoffs). This flow is a faithful diagram of
   that wiring — every node kind IS a Line primitive:

     start        the call begins (Line: the introduction plays)
     conversation a task the agent handles (compiled into the system prompt)
     subagent     a distinct stage handed to a specialized agent
                  (Line: agent_as_handoff / @handoff_tool)
     tool         a tool call whose result returns to the agent
                  (Line: a loopback tool or built-in knowledge_base)
     transfer     hand off to a human (Line: transfer_call)
     end          wrap up and hang up (Line: end_call)

   There is deliberately NO decision node — Line has no branching
   runtime. Branches are outgoing edges with natural-language
   conditions, which is exactly what becomes each tool/handoff
   description that tells the LLM when to take that path. */

export type FlowNodeKind = 'start' | 'conversation' | 'subagent' | 'tool' | 'transfer' | 'end'

export interface FlowNode {
  id: string
  kind: FlowNodeKind
  title: string
  /** 1–2 sentences: what the agent does or says at this step. */
  instruction?: string
  /** For tool nodes: the Line tool involved (e.g. "knowledge_base",
      "check_open_slots"). Shown verbatim on the node card. */
  tool?: string
}

export interface FlowEdge {
  from: string
  to: string
  /** Short natural-language condition for taking this edge — what would
      become the tool/handoff description in Line. */
  condition?: string
}

export interface AgentFlow {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

const KINDS: FlowNodeKind[] = ['start', 'conversation', 'subagent', 'tool', 'transfer', 'end']

/** Validate an LLM-generated flow: drop malformed nodes/edges, ensure a
    start node exists. Returns null if nothing usable remains. */
export function sanitizeFlow(raw: unknown): AgentFlow | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as { nodes?: unknown[]; edges?: unknown[] }

  const nodes: FlowNode[] = (candidate.nodes ?? [])
    .filter((n): n is FlowNode => {
      if (!n || typeof n !== 'object') return false
      const node = n as Partial<FlowNode>
      return typeof node.id === 'string' && node.id.length > 0
        && typeof node.title === 'string' && node.title.length > 0
        && KINDS.includes(node.kind as FlowNodeKind)
    })
    .map(n => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      ...(typeof n.instruction === 'string' && n.instruction ? { instruction: n.instruction } : {}),
      ...(typeof n.tool === 'string' && n.tool ? { tool: n.tool } : {}),
    }))

  if (nodes.length === 0) return null

  const ids = new Set(nodes.map(n => n.id))
  const edges: FlowEdge[] = (candidate.edges ?? [])
    .filter((e): e is FlowEdge => {
      if (!e || typeof e !== 'object') return false
      const edge = e as Partial<FlowEdge>
      return typeof edge.from === 'string' && ids.has(edge.from)
        && typeof edge.to === 'string' && ids.has(edge.to)
        && edge.from !== edge.to
    })
    .map(e => ({
      from: e.from,
      to: e.to,
      ...(typeof e.condition === 'string' && e.condition ? { condition: e.condition } : {}),
    }))

  if (nodes.some(n => n.kind === 'start')) return { nodes, edges }

  // No explicit start — synthesize one pointing at the first node.
  const start: FlowNode = { id: '__start', kind: 'start', title: 'Call begins' }
  return { nodes: [start, ...nodes], edges: [{ from: '__start', to: nodes[0].id }, ...edges] }
}

/** Layered left→right auto-layout: depth = longest path from start
    (cycle-safe), column per depth, vertical stack within a column. */
export function layoutFlow(flow: AgentFlow): Record<string, { x: number; y: number }> {
  // Cards are 230 wide — the wide pitch leaves a real channel between
  // columns so edge-condition chips never sit on a node.
  const COL_W = 400
  const ROW_H = 180

  const out = new Map<string, string[]>()
  flow.edges.forEach(e => {
    out.set(e.from, [...(out.get(e.from) ?? []), e.to])
  })

  const start = flow.nodes.find(n => n.kind === 'start') ?? flow.nodes[0]
  const depth = new Map<string, number>([[start.id, 0]])

  // Longest-path layering with a visit cap so cycles can't loop forever.
  const queue: string[] = [start.id]
  let guard = flow.nodes.length * flow.edges.length + flow.nodes.length
  while (queue.length > 0 && guard-- > 0) {
    const id = queue.shift()!
    const d = depth.get(id) ?? 0
    for (const next of out.get(id) ?? []) {
      const candidate = d + 1
      if (candidate > (depth.get(next) ?? -1) && candidate < flow.nodes.length) {
        depth.set(next, candidate)
        queue.push(next)
      }
    }
  }

  // Unreachable nodes go to a trailing column.
  const maxDepth = Math.max(0, ...depth.values())
  flow.nodes.forEach(n => {
    if (!depth.has(n.id)) depth.set(n.id, maxDepth + 1)
  })

  const columns = new Map<number, FlowNode[]>()
  flow.nodes.forEach(n => {
    const d = depth.get(n.id)!
    columns.set(d, [...(columns.get(d) ?? []), n])
  })

  // Parents of each node — used to order rows so edges cross less.
  const parents = new Map<string, string[]>()
  flow.edges.forEach(e => {
    parents.set(e.to, [...(parents.get(e.to) ?? []), e.from])
  })

  const positions: Record<string, { x: number; y: number }> = {}
  const depths = [...columns.keys()].sort((a, b) => a - b)
  depths.forEach(d => {
    const nodesInCol = columns.get(d)!
    // Barycenter pass: each node follows the average row of its already-
    // placed parents, so branches fan out instead of criss-crossing.
    const keyed = nodesInCol.map((n, i) => {
      const parentYs = (parents.get(n.id) ?? [])
        .map(pid => positions[pid]?.y)
        .filter((y): y is number => y !== undefined)
      const bary = parentYs.length > 0 ? parentYs.reduce((a, b) => a + b, 0) / parentYs.length : i * ROW_H
      return { n, bary }
    })
    const ordered = [...keyed].sort((a, b) => a.bary - b.bary)
    const colHeight = (ordered.length - 1) * ROW_H
    const meanBary = ordered.reduce((a, k) => a + k.bary, 0) / ordered.length
    ordered.forEach((k, i) => {
      positions[k.n.id] = {
        x: d * COL_W,
        // Center the column on its parents' center of mass, then stagger
        // odd columns slightly so straight runs don't overlap edge chips.
        y: meanBary + i * ROW_H - colHeight / 2 + (d % 2 === 1 ? 28 : 0),
      }
    })
  })
  return positions
}

/* Demo flow for the sample banking agent (open-dialogue), in Line's own
   terms: prompt tasks branch via conditioned edges, a custom loopback
   tool fetches data, dispute intake is a subagent handoff, and the call
   exits through transfer_call / end_call. */
export const DEMO_FLOW: AgentFlow = {
  nodes: [
    { id: 'start', kind: 'start', title: 'Call begins', instruction: 'Priya answers with the configured introduction.' },
    { id: 'verify', kind: 'conversation', title: 'Greet & verify identity', instruction: 'Ask for the last four digits of card or SSN before any account talk.' },
    { id: 'balance', kind: 'tool', title: 'Look up balance & transactions', tool: 'account_lookup', instruction: 'Fetch the account summary; weave figures into a sentence, never a flat list.' },
    { id: 'card', kind: 'conversation', title: 'Card services', instruction: 'Report lost or stolen, order replacement, or toggle freeze.' },
    { id: 'dispute', kind: 'subagent', title: 'Dispute intake', instruction: 'Hand the call to the dispute specialist agent: collects merchant, amount, and date, then confirms a case.' },
    { id: 'fraud', kind: 'transfer', title: 'Escalate to fraud team', instruction: 'Confirm callback number, then transfer.' },
    { id: 'verify-fail', kind: 'conversation', title: 'Verification failed', instruction: 'Offer a live agent — no account details without verification.' },
    { id: 'wrap', kind: 'conversation', title: 'Wrap up', instruction: 'Confirm the issue is resolved; offer anything else.' },
    { id: 'end', kind: 'end', title: 'End call', instruction: '"Take care — have a good one."' },
  ],
  edges: [
    { from: 'start', to: 'verify' },
    { from: 'verify', to: 'balance', condition: 'asks for balance or transactions' },
    { from: 'verify', to: 'card', condition: 'card issue' },
    { from: 'verify', to: 'dispute', condition: 'wants to dispute a charge' },
    { from: 'verify', to: 'verify-fail', condition: 'fails verification twice' },
    { from: 'dispute', to: 'fraud', condition: 'fraud suspected' },
    { from: 'balance', to: 'wrap' },
    { from: 'card', to: 'wrap' },
    { from: 'dispute', to: 'wrap', condition: 'case opened' },
    { from: 'verify-fail', to: 'end' },
    { from: 'wrap', to: 'end', condition: 'caller says goodbye' },
  ],
}
