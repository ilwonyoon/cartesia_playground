import { useState } from 'react'
import { ChevronDown, Sparkles, Check, Upload } from 'lucide-react'
import { cn } from '../lib/utils'
import { Toggle } from '../components/ui/Toggle'

/* ── Agent Configuration tab (Figma 56:1387) ──────────────────
   Two-column form: System Prompt + Initial Message (left),
   Voice & Language / ASR / Background Sound (right).
   Basic interactivity: text fields type, toggle/checkbox hold state. */

/* Info glyph — exact Figma path (56:1405), filled circle. */
function InfoIcon({ size = 16, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M3.28611 3.28611C3.90331 2.65878 4.63861 2.15985 5.4496 1.81811C6.26058 1.47637 7.1312 1.29858 8.01124 1.295C8.89128 1.29142 9.76333 1.46211 10.5771 1.79723C11.3908 2.13236 12.1301 2.62528 12.7524 3.24756C13.3747 3.86985 13.8676 4.60919 14.2028 5.42293C14.5379 6.23667 14.7086 7.10872 14.705 7.98876C14.7014 8.8688 14.5236 9.73942 14.1819 10.5504C13.8402 11.3614 13.3412 12.0967 12.7139 12.7139C11.4602 13.9473 9.76993 14.6354 8.01124 14.6282C6.25255 14.6211 4.56794 13.9192 3.32434 12.6757C2.08075 11.4321 1.37894 9.74745 1.37178 7.98876C1.36462 6.23007 2.05269 4.53979 3.28611 3.28611ZM8.83333 4.11111V5.77778H7.16667V4.11111H8.83333ZM5.77778 8.27778H7.16667V9.66667H5.77778V11.3333H10.2222V9.66667H8.83333V6.61111H5.77778V8.27778Z" fill="currentColor"/>
    </svg>
  )
}

/* Small info button beside a section heading. */
function InfoButton() {
  return (
    <button className="text-neutral-500 hover:text-neutral-700 cursor-pointer shrink-0" aria-label="More info">
      <InfoIcon size={16} />
    </button>
  )
}

const DEFAULT_SYSTEM_PROMPT = `You are a friendly voice assistant built with Cartesia, designed for natural, open-ended conversation.

# Personality

Warm, curious, genuine, lighthearted. Knowledgeable but not showy.

# Voice and tone

Speak like a thoughtful friend, not a formal assistant or customer service bot.
Use contractions and casual phrasing—the way people actually talk.
Match the caller's energy: playful if they're playful, grounded if they're serious.
Show genuine interest: "Oh that's interesting" or "Hmm, let me think about that."

# Response style

Keep responses to 1-2 sentences for most exchanges. This is a conversation, not a lecture.
For complex topics, break information into digestible pieces and check in with the caller.
Never use lists, bullet points, or structured formatting—speak in natural prose.
Never say "Great question!" or other hollow affirmations.

# Tools

## web_search
Use when you genuinely don't know something or need current information. Don't overuse it.

Before searching, acknowledge naturally:
- "Let me look that up"
- "Good question, let me check"
- "Hmm, I'm not sure—give me a sec"

After searching, synthesize into a brief conversational answer. Never read search results verbatim.

## end_call
Use when the conversation has clearly concluded—goodbye, thanks, that's all, etc.

Process:
1. Say a natural goodbye first: "Take care!" or "Nice chatting with you!"
2. Then call end_call

Never use for brief pauses or "hold on" moments.

# About Cartesia (share when asked or naturally relevant)
Cartesia is a voice AI company making voice agents that feel natural and responsive. Your voice comes from Sonic, their text-to-speech model with ultra-low latency—under 90ms to first audio. You hear through Ink, their speech-to-text model optimized for real-world noise. This agent runs on Line, Cartesia's open-source voice agent framework. For building voice agents: docs.cartesia.ai

# Handling common situations
Didn't catch something: "Sorry, I didn't catch that—could you say that again?"
Don't know the answer: "I'm not sure about that. Want me to look it up?"
Caller seems frustrated: Acknowledge it, try a different approach
Off-topic or unusual request: Roll with it—you can chat about anything

# Topics you can discuss
Anything the caller wants: their day, current events, science, culture, philosophy, personal decisions, interesting ideas. Help think through problems by asking clarifying questions. Use light, natural humor when appropriate.`

const DEFAULT_INITIAL_MESSAGE = `Hey! I'm a Cartesia voice assistant. What would you like to talk about?`

/* Section heading shared across the form (Figma "Heading 2"). */
function SectionHeading({ children, info }: { children: React.ReactNode; info?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-[13.3px] font-[500] text-neutral-900 leading-5">{children}</h2>
      {info && <InfoButton />}
    </div>
  )
}

export function AgentConfigurationTab() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [initialMessage, setInitialMessage] = useState(DEFAULT_INITIAL_MESSAGE)
  const [skipIntro, setSkipIntro] = useState(false)
  const [languageDetection, setLanguageDetection] = useState(false)

  return (
    <div className="flex flex-col gap-4">

      {/* Header: title only — Preview/Publish live in the top header bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-[19px] font-[600] text-neutral-900 leading-7">Configuration</h3>
      </div>

      {/* Two-column grid (Figma 56:1398) */}
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8 items-start">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-8 min-w-0">

          {/* System Prompt */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <SectionHeading info>System Prompt</SectionHeading>
              <button className="h-[26px] px-2.5 flex items-center gap-1 rounded-[5.76px] border border-neutral-400 bg-neutral-100 text-[12.4px] font-[500] text-neutral-900 hover:bg-neutral-200 cursor-pointer">
                <Sparkles size={16} strokeWidth={1.5} />
                Generate
              </button>
            </div>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              spellCheck={false}
              className="h-[409px] w-full resize-none rounded-[7.2px] border border-neutral-400 bg-white px-[11px] py-[9px] text-[13px] leading-5 text-neutral-900 outline-none focus:border-neutral-600"
            />
          </div>

          {/* Initial Message */}
          <div className="flex flex-col gap-4">
            <SectionHeading info>Initial Message</SectionHeading>
            <input
              value={initialMessage}
              onChange={e => setInitialMessage(e.target.value)}
              className="h-8 w-full rounded-[7.2px] border border-neutral-400 bg-white px-[11px] text-[12.8px] text-neutral-900 outline-none focus:border-neutral-600"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                role="checkbox"
                aria-checked={skipIntro}
                onClick={() => setSkipIntro(v => !v)}
                className={cn(
                  'w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 cursor-pointer transition-colors',
                  skipIntro ? 'bg-brand border-brand' : 'border-neutral-400 bg-white',
                )}
              >
                {skipIntro && <Check size={12} strokeWidth={3} className="text-white" />}
              </button>
              <span className="text-[13.3px] text-neutral-600 leading-6">Skip agent introduction</span>
              <InfoButton />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-8 pt-2 min-w-0">

          {/* Voice & Language */}
          <div className="flex flex-col gap-[17px]">
            <SectionHeading>Voice &amp; Language</SectionHeading>
            <button className="h-[30px] w-full flex items-center gap-2 pl-5 pr-2.5 rounded-[7.2px] border border-neutral-400 bg-neutral-100 hover:bg-neutral-200 cursor-pointer">
              <span className="text-base leading-none">🇺🇸</span>
              <span className="flex-1 min-w-0 text-left text-[13px] font-[500] text-neutral-900 truncate">Skylar - Friendly Guide</span>
              <ChevronDown size={16} strokeWidth={1.33} className="text-neutral-900 shrink-0" />
            </button>
            <p className="text-[11.3px] text-neutral-600 leading-4">Language: English</p>
          </div>

          {/* Automatic Speech Recognition */}
          <div className="flex flex-col gap-4">
            <SectionHeading>Automatic Speech Recognition</SectionHeading>

            {/* Model select */}
            <div className="flex flex-col gap-2">
              <label className="text-[13.6px] font-[500] text-neutral-900 leading-[14px]">Model</label>
              <button className="h-8 w-full flex items-center justify-between pl-[11px] pr-2.5 rounded-[7.2px] border border-neutral-400 bg-white hover:border-neutral-600 cursor-pointer">
                <span className="text-[12.7px] text-neutral-900">Ink-2</span>
                <ChevronDown size={16} strokeWidth={1.33} className="text-neutral-600 shrink-0" />
              </button>
            </div>

            {/* Language detection toggle + Beta */}
            <div className="flex flex-col gap-2">
              <Toggle
                checked={languageDetection}
                onChange={setLanguageDetection}
                label="Language detection"
                badge="Beta"
              />
              <p className="text-[11.1px] text-neutral-600 leading-4">
                Auto-detect the caller's language and respond in kind. Supports English, Spanish, French, German, Hindi, Russian, Portuguese, Japanese, Italian, and Dutch.
              </p>
            </div>
          </div>

          {/* Background Sound */}
          <div className="flex flex-col gap-[17px]">
            <div className="flex flex-col gap-2">
              <SectionHeading>Background Sound</SectionHeading>
              <p className="text-[12.8px] text-neutral-500 leading-5">Add sound to play in the background of your agent's speech.</p>
            </div>
            <button className="h-[30px] w-full flex items-center gap-3 pl-5 pr-2.5 rounded-[7.2px] border border-neutral-400 bg-neutral-100 hover:bg-neutral-200 cursor-pointer">
              <span className="text-[13.6px] font-[500] text-neutral-700 leading-5 shrink-0">Choose File</span>
              <span className="flex-1 min-w-0 text-left text-[13.3px] font-[500] text-neutral-500 leading-5 truncate">No file chosen</span>
              <Upload size={16} strokeWidth={1.33} className="text-neutral-900 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
