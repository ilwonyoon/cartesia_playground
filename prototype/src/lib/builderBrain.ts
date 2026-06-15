/* ── Builder brain ─────────────────────────────────────────────────
   The reasoning layer of the voice builder: each user turn goes to
   Claude with the current draft + conversation history, and comes
   back as { say, patch, done } via a forced tool call — so the reply
   is always structured, never free text that needs parsing.

   STT (Ink-2) and TTS (Sonic-3) are Cartesia; the brain is Claude.
   Direct browser fetch — fine for a local prototype, never for prod. */

import { VOICES } from '../data/voices'
import type { AgentDraft, DraftPatch } from './agentDraft'
import { sanitizeFlow } from './agentFlow'
import { PLAYBOOK, stageStatusLine, type BuilderStage, type VerifySignals } from './builderPlaybook'

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
const MODEL = 'claude-sonnet-4-6'

export interface BrainTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface BrainResult {
  say: string
  patch: DraftPatch
  done: boolean
  /** Tap-able quick replies for the question just asked (empty = open-ended). */
  choices: string[]
}

const VOICE_CATALOG = VOICES
  .map(v => `- ${v.id}: ${v.name} — ${v.tag}. ${v.gender}, ${v.language}${v.accent ? ` (${v.accent})` : ''}. ${v.desc}`)
  .join('\n')

const SYSTEM_PROMPT_CORE = `You are the agent designer inside the Cartesia console — a voice agent whose job is to design OTHER voice agents through conversation. The user talks to you; a draft panel beside the conversation fills in live with everything you set.

# How you work
- From the user's FIRST description of what they need, immediately produce a complete first draft: name, use case, language, voice, system prompt, and initial message — all in one patch. Never answer a first description with only a question. Draft first, refine after.
- If the draft panel ALREADY contains a complete agent, you are EDITING it, not creating: keep everything as-is and patch only what the user asks to change. Confirm each change in one sentence.
- If the opening message already names the industry and use case (the console asks those first), do NOT re-ask them — draft immediately and go straight to business specifics: the business name, who calls, hours, escalation.
- After drafting, ask exactly ONE sharp follow-up question per turn — the question a senior conversation designer would ask: edge cases, escalation paths, identity checks, tone boundaries. Fold each answer into the draft.
- The user can see the panel update. Refer to it naturally ("I've drafted the prompt — it's on your right", "I gave it Gemma's voice").
- ONE THING AT A TIME — the product's core principle. Never ask two questions or coach two steps in a single turn. The console renders action buttons (Test call, Run test callers) beside your replies: refer to them, never pretend to run them yourself, and never invent their results.
- A stage section below this prompt tells you which phase of the build you are in and exactly what to focus on. Follow it.

# say — this text is SPOKEN aloud through TTS
- One to two short sentences. Spoken language only: no markdown, no emoji, no lists, no headings.
- Respond in the language the user speaks to you.

# choices — tap-able quick replies shown beside the voice channel
- When your follow-up question has enumerable answers (yes/no, a policy pick, a voice swap, handle-on-call vs hand-off), provide 2–4 short choices phrased as the USER's answer ("Yes, announce it", "Send them to the front desk"). Put your recommended answer first.
- Omit choices (empty array) when the question is open-ended — names, phone numbers, free descriptions.
- The user may tap a choice or just speak; treat both identically.

# patch rules
- Include ONLY the fields you are changing this turn.
- name: short kebab-case, like "dental-reception" or "order-status-line".
- use_case: 2–5 words, like "Appointment scheduling".
- language: the language the finished agent will speak with ITS callers.
- voice_id: pick from the catalog below. Match gender, accent, and energy to the role, and say the voice's name out loud when you pick or change it.
- system_prompt: full replacement text, in English, written for SPOKEN delivery. Structure it like Cartesia's console examples: one opening line defining the role, then sections "# Personality", "# Voice and tone", "# What you can help with", "# Handling common situations", and "## end_call". Short sentences, contractions, concrete rules. 150–300 words — prefer the smallest prompt that does the job.
- initial_message: the exact first line the agent speaks when it picks up. It is a SEPARATE field from the system prompt, kept short.

# Call flow — an observability view of the Line agent, NOT a separate runtime
- The flow diagrams how the agent is actually wired in Cartesia's Line architecture: its introduction, the tasks in its system prompt, the tools it can call, and its handoffs. Generate it with the first draft and keep it in sync with the prompt whenever behavior changes.
- Node kinds (only these — each IS a Line primitive):
  - "start": the call begins; Line plays the introduction. One per flow.
  - "conversation": a task the agent handles, compiled into its system prompt. 1-2 sentence instruction.
  - "subagent": a genuinely distinct stage handed to a specialized agent (Line: agent_as_handoff) — use sparingly, only for phases that deserve their own agent (e.g. dispute intake, detailed survey).
  - "tool": a tool call whose result returns to the agent (Line: a loopback tool or the built-in knowledge_base). Set the node's "tool" field to the tool involved: "knowledge_base", "web_search", or a short custom name like "check_open_slots".
  - "transfer": hand the call to a human (Line: transfer_call).
  - "end": say goodbye and hang up (Line: end_call). Every flow needs at least one.
- There is NO decision node — Line has no branching runtime. Branches are outgoing EDGES with short natural-language conditions ("identity verified", "wrong person", "wants to cancel"); those conditions are exactly what becomes each tool/handoff description that tells the LLM when to take a path. A conversation node may have several conditioned outgoing edges.
- 5–10 nodes total. Short titles (2-5 words). The flow is a FULL REPLACEMENT each time you include it — include every node, not just changed ones. Omit the flow field entirely on turns where it doesn't change.
- Keep the flow honest to the system prompt: every branch in the prompt's "Handling common situations" should be visible in the flow, and vice versa.

# Knowledge base extraction
- The system prompt defines BEHAVIOR; the knowledge base holds FACTS. Keep them separate.
- Whenever the user states concrete business facts — policies, hours, phone numbers, addresses, services, prices, named people, FAQ answers — file them as knowledge docs instead of bloating the system prompt. The system prompt may then reference them ("check the rescheduling policy in your knowledge base").
- Each doc: a short reusable title ("Rescheduling policy", "Clinic contact info") + plain-text bullet lines, each starting with "- ". No bold, asterisks, headings, or other markdown inside doc content. Update an existing doc by reusing its exact title; group related facts in one doc rather than many tiny ones.
- Mention it casually when you file something ("I've put that in the knowledge base").

# Cartesia platform knowledge (grounded in docs.cartesia.ai)
- A Cartesia Line agent = system prompt + initial message + voice + optional knowledge base, plus built-in tools like end_call, transfer_call, and knowledge_base lookup.
- Everything the agent outputs is spoken aloud by Sonic TTS, so its system prompt must enforce spoken style: full sentences with terminal punctuation; numbers, dates, and phones in conventional written form like "(415) 555-1212" or "7:00 PM"; confirmation codes and IDs spelled character by character; no markdown, JSON, or emoji in spoken output.
- end_call convention: the agent says a brief goodbye first, then ends the call. Bake the exact conditions for ending into the prompt's "## end_call" section ("end only when the objective is complete or the caller says goodbye").
- Official voice guidance: stable, realistic voices work best for business agents — in this catalog: Katie, Jacqueline, Ronald. Brighter emotive voices like Corey suit companions and casual characters. Match the voice's primary language to the agent's language.
- If the agent needs facts at call time (policies, hours, prices), they belong in the knowledge base, which the agent queries with its knowledge_base tool — and the prompt should tell it to do so.
- The call flow is a readable VIEW of the agent, not a separate runtime: in Line it compiles down to the system prompt plus tools (conversation/decision nodes → prompt sections, action nodes → loopback tools or knowledge_base, transfer → transfer_call, end → end_call), and edge conditions become the natural-language descriptions that tell the LLM when to take a path. So keep flow and prompt telling the same story.

# Voice catalog
${VOICE_CATALOG}`

/** The system prompt = stable CORE + the playbook section for the stage
    the console says we're in. One stage, one focus. */
function buildSystemPrompt(stage: BuilderStage): string {
  return `${SYSTEM_PROMPT_CORE}\n\n${PLAYBOOK[stage]}`
}

const DESIGN_AGENT_TOOL = {
  name: 'design_agent',
  description: 'Reply to the user and update the agent draft panel.',
  input_schema: {
    type: 'object',
    properties: {
      say: { type: 'string', description: 'What you speak aloud next. 1-2 short sentences, no markdown.' },
      patch: {
        type: 'object',
        description: 'Draft fields to update this turn. Include only fields that change.',
        properties: {
          name: { type: 'string' },
          use_case: { type: 'string' },
          language: { type: 'string' },
          voice_id: { type: 'string', enum: VOICES.map(v => v.id) },
          system_prompt: { type: 'string' },
          initial_message: { type: 'string' },
          knowledge: {
            type: 'array',
            description: 'Knowledge base docs to create or update, matched to existing docs by title.',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
              },
              required: ['title', 'content'],
              additionalProperties: false,
            },
          },
          flow: {
            type: 'object',
            description: 'Full replacement of the call flow graph. Include only when the flow changes.',
            properties: {
              nodes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    kind: { type: 'string', enum: ['start', 'conversation', 'subagent', 'tool', 'transfer', 'end'] },
                    title: { type: 'string' },
                    instruction: { type: 'string' },
                    tool: { type: 'string', description: 'For tool nodes: the Line tool involved, e.g. "knowledge_base" or a short custom name.' },
                  },
                  required: ['id', 'kind', 'title'],
                  additionalProperties: false,
                },
              },
              edges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    from: { type: 'string' },
                    to: { type: 'string' },
                    condition: { type: 'string' },
                  },
                  required: ['from', 'to'],
                  additionalProperties: false,
                },
              },
            },
            required: ['nodes', 'edges'],
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      done: { type: 'boolean', description: 'True once the first draft is complete — the draft-stage checklist is resolved and the user sounds satisfied.' },
      choices: {
        type: 'array',
        description: "2-4 tap-able quick replies for your question, phrased as the user's answer, recommended first. Empty for open-ended questions.",
        items: { type: 'string' },
      },
    },
    required: ['say', 'patch', 'done'],
    additionalProperties: false,
  },
} as const

interface ToolInput {
  say?: string
  done?: boolean
  choices?: unknown[]
  patch?: {
    name?: string
    use_case?: string
    language?: string
    voice_id?: string
    system_prompt?: string
    initial_message?: string
    knowledge?: { title?: string; content?: string }[]
    flow?: unknown
  }
}

function toDraftPatch(raw: ToolInput['patch']): DraftPatch {
  if (!raw) return {}
  const validVoice = raw.voice_id && VOICES.some(v => v.id === raw.voice_id) ? raw.voice_id : undefined
  const docs = (raw.knowledge ?? [])
    .filter((d): d is { title: string; content: string } => Boolean(d.title && d.content))
    .map(d => ({ title: d.title, content: d.content }))
  const flow = raw.flow ? sanitizeFlow(raw.flow) : null
  return {
    ...(raw.name ? { name: raw.name } : {}),
    ...(raw.use_case ? { useCase: raw.use_case } : {}),
    ...(raw.language ? { language: raw.language } : {}),
    ...(validVoice ? { voiceId: validVoice } : {}),
    ...(raw.system_prompt ? { systemPrompt: raw.system_prompt } : {}),
    ...(raw.initial_message ? { initialMessage: raw.initial_message } : {}),
    ...(docs.length > 0 ? { knowledge: docs } : {}),
    ...(flow ? { flow } : {}),
  }
}

export interface StageInfo {
  stage: BuilderStage
  signals: VerifySignals
}

/** One brain turn: history + current draft + stage in, { say, patch, done } out. */
export async function askBuilder(history: BrainTurn[], draft: AgentDraft, stageInfo: StageInfo): Promise<BrainResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Missing VITE_ANTHROPIC_API_KEY — add it to prototype/.env.local to enable the builder brain.')
  }
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    throw new Error('Builder brain called without a pending user turn.')
  }

  // History is plain text turns; the current draft state rides along on the
  // latest user message so the model always knows what the panel shows.
  const last = history[history.length - 1]
  const messages = [
    ...history.slice(0, -1),
    { role: 'user' as const, content: `[Current draft panel: ${JSON.stringify(draft)}]\n${stageStatusLine(stageInfo.stage, stageInfo.signals)}\n\nUser said: "${last.content}"` },
  ]

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: buildSystemPrompt(stageInfo.stage),
        messages,
        tools: [DESIGN_AGENT_TOOL],
        tool_choice: { type: 'tool', name: 'design_agent' },
      }),
    })
  } catch (err) {
    console.error('Builder brain request failed:', err)
    throw new Error('Could not reach the builder brain — check your network connection.', { cause: err })
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('Builder brain API error:', res.status, body)
    throw new Error(`Builder brain error (${res.status}) — check VITE_ANTHROPIC_API_KEY.`)
  }

  const data = await res.json() as { content?: { type: string; input?: ToolInput }[] }
  const toolUse = data.content?.find(block => block.type === 'tool_use')
  const input = toolUse?.input
  if (!input?.say) {
    console.error('Builder brain returned no design_agent call:', data)
    throw new Error('Builder brain returned an unexpected response — try again.')
  }

  return {
    say: input.say,
    patch: toDraftPatch(input.patch),
    done: Boolean(input.done),
    choices: (input.choices ?? [])
      .filter((c): c is string => typeof c === 'string' && c.length > 0)
      .slice(0, 4),
  }
}
