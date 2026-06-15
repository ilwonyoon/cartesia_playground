/* ── Business material ingestion ───────────────────────────────────
   "자료를 먼저 받는 건 필수" — the builder designs a far better agent
   when it has the business's own material. Two inlets:
     · a website URL (fetched as clean text via Jina Reader, which is
       CORS-open — the browser can't fetch arbitrary sites directly)
     · pasted/uploaded text files (.txt / .md)
   Raw material is summarized into a compact business brief (Haiku)
   before entering the conversation, so the transcript stays light and
   the brain files concrete facts into the knowledge base itself. */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
const SUMMARIZER_MODEL = 'claude-haiku-4-5'
const MAX_RAW_CHARS = 14000

/** Pull readable text for a URL through Jina Reader. */
export async function fetchWebsiteText(url: string): Promise<string> {
  const normalized = url.startsWith('http') ? url : `https://${url}`
  let res: Response
  try {
    res = await fetch(`https://r.jina.ai/${normalized}`, {
      headers: { Accept: 'text/plain' },
    })
  } catch (err) {
    console.error('Website fetch failed:', err)
    throw new Error('Could not reach the site — check the address, or paste the content as a file instead.', { cause: err })
  }
  if (!res.ok) {
    throw new Error(`Could not read the site (${res.status}) — try pasting the content as a file instead.`)
  }
  const text = await res.text()
  if (!text.trim()) throw new Error('The site returned no readable text.')
  return text.slice(0, MAX_RAW_CHARS)
}

/** Read uploaded .txt/.md files into one blob of text. */
export async function readTextFiles(files: File[]): Promise<string> {
  const parts = await Promise.all(files.map(async f => {
    const text = await f.text()
    return `--- ${f.name} ---\n${text}`
  }))
  const joined = parts.join('\n\n')
  if (!joined.trim()) throw new Error('The files were empty.')
  return joined.slice(0, MAX_RAW_CHARS)
}

/** A read of business material: a brief for the conversation to carry,
    plus the industry it most resembles (drives the use-case step) and the
    business's display name when the material makes it obvious. */
export interface MaterialRead {
  brief: string
  /** One of the intake industry ids, or null if it fits none well. */
  industryId: 'finance' | 'healthcare' | 'government' | 'other' | null
  /** The business name if clearly stated, else null. */
  businessName: string | null
}

const READ_TOOL = {
  name: 'read_business',
  description: 'Return a brief of the business material plus how to classify it.',
  input_schema: {
    type: 'object',
    properties: {
      brief: {
        type: 'string',
        description: 'PLAIN TEXT brief (no markdown), under 250 words: 1) what the business is and does, 2) services/products with prices if present, 3) hours, locations, contact numbers, 4) policies (booking, cancellation, returns), 5) tone of voice. Only facts present in the material — never invent.',
      },
      industry_id: {
        type: 'string',
        enum: ['finance', 'healthcare', 'government', 'other'],
        description: 'The intake industry this business most resembles: finance (banks, lenders, payments, insurance), healthcare (clinics, dental, pharmacy, providers), government (public sector, civic services), or other (anything else — retail, hospitality, professional services, etc.).',
      },
      business_name: {
        type: 'string',
        description: 'The business name if the material clearly states it; omit if unclear.',
      },
    },
    required: ['brief', 'industry_id'],
    additionalProperties: false,
  },
} as const

export async function summarizeBusinessMaterial(source: string, raw: string): Promise<MaterialRead> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Missing VITE_ANTHROPIC_API_KEY — add it to prototype/.env.local.')
  }
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
        model: SUMMARIZER_MODEL,
        max_tokens: 800,
        system: 'You read business material for a voice-agent designer and classify it. Use the read_business tool. Only include facts present in the material — never invent.',
        messages: [{ role: 'user', content: `Source: ${source}\n\nMaterial:\n${raw}` }],
        tools: [READ_TOOL],
        tool_choice: { type: 'tool', name: 'read_business' },
      }),
    })
  } catch (err) {
    console.error('Material summarization failed:', err)
    throw new Error('Could not process the material — try again.', { cause: err })
  }
  if (!res.ok) {
    console.error('Material summarization API error:', res.status, await res.text().catch(() => ''))
    throw new Error(`Could not process the material (${res.status}).`)
  }
  const data = await res.json() as { content?: { type: string; input?: { brief?: string; industry_id?: string; business_name?: string } }[] }
  const input = data.content?.find(b => b.type === 'tool_use')?.input
  if (!input?.brief) throw new Error('The summarizer returned nothing usable.')
  const ALLOWED = ['finance', 'healthcare', 'government', 'other'] as const
  const industryId = ALLOWED.includes(input.industry_id as typeof ALLOWED[number])
    ? (input.industry_id as MaterialRead['industryId'])
    : null
  return {
    brief: input.brief,
    industryId,
    businessName: input.business_name?.trim() || null,
  }
}

/** First http(s) URL or bare domain found in a string, if any. */
export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s)]+|(?:^|\s)((?:[a-z0-9-]+\.)+[a-z]{2,})(?:\/[^\s)]*)?/i)
  if (!match) return null
  return (match[0] ?? '').trim() || null
}

/** Display label for a URL (host without protocol). */
export function hostOf(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).host
  } catch {
    return url
  }
}
