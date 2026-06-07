import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Sparkles, Check, Upload, ChevronRight, User, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { Toggle } from '../components/ui/Toggle'
import { AVATARS, type Avatar } from './AvatarsPage'

const CURRENT_VOICE = 'Skylar - Friendly Guide'

type Variation = 'current' | 'v1' | 'v2'

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

/* ── Persona avatars for V1/V2 ── */
const PERSONAS = [
  { id: 'skylar', name: 'Skylar', role: 'Friendly Guide', industry: 'General', gender: 'Female', voice: 'Skylar', language: 'English', emoji: '👩', color: 'bg-green-100' },
  { id: 'nova', name: 'Nova', role: 'Financial Advisor', industry: 'Finance', gender: 'Female', voice: 'Nova', language: 'English', emoji: '👩‍💼', color: 'bg-blue-100' },
  { id: 'marcus', name: 'Marcus', role: 'Healthcare Coordinator', industry: 'Healthcare', gender: 'Male', voice: 'Marcus', language: 'English', emoji: '👨‍⚕️', color: 'bg-teal-100' },
  { id: 'aria', name: 'Aria', role: 'Government Assistant', industry: 'Government', voice: 'Aria', gender: 'Female', language: 'English', emoji: '👩‍💻', color: 'bg-purple-100' },
  { id: 'james', name: 'James', role: 'Sales Representative', industry: 'Sales', gender: 'Male', voice: 'James', language: 'English', emoji: '👨‍💼', color: 'bg-orange-100' },
  { id: 'luna', name: 'Luna', role: 'Customer Support', industry: 'Support', gender: 'Female', voice: 'Luna', language: 'English', emoji: '👩‍🔬', color: 'bg-pink-100' },
] as const

type PersonaId = typeof PERSONAS[number]['id']
type Industry = 'All' | 'Finance' | 'Healthcare' | 'Government' | 'Sales' | 'Support' | 'General'

/* ── Persona card shown in the right column (V1) ── */
function PersonaCard({ personaId, onClick }: { personaId: PersonaId; onClick: () => void }) {
  const p = PERSONAS.find(x => x.id === personaId)!
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-[9px] border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 cursor-pointer text-left transition-colors"
    >
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0', p.color)}>
        {p.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-[600] text-neutral-900 leading-5">{p.name}</div>
        <div className="text-[11.5px] text-neutral-500 leading-4 truncate">{p.role} · {p.language}</div>
        <div className="text-[11px] text-neutral-400 leading-4">{p.gender} voice</div>
      </div>
      <ChevronRight size={15} className="text-neutral-400 shrink-0" />
    </button>
  )
}

/* ── Persona picker sheet (V2) ── */
function PersonaPickerSheet({ selected, onSelect, onClose }: {
  selected: PersonaId
  onSelect: (id: PersonaId) => void
  onClose: () => void
}) {
  const [industry, setIndustry] = useState<Industry>('All')
  const industries: Industry[] = ['All', 'Finance', 'Healthcare', 'Government', 'Sales', 'Support', 'General']
  const filtered = industry === 'All' ? PERSONAS : PERSONAS.filter(p => p.industry === industry)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative w-full max-w-[560px] bg-white rounded-t-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-[600] text-neutral-900">Choose a Persona</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-[22px] leading-none cursor-pointer">&times;</button>
        </div>

        {/* Industry filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {industries.map(ind => (
            <button
              key={ind}
              onClick={() => setIndustry(ind)}
              className={cn(
                'px-3 py-1 rounded-full text-[12px] font-[500] cursor-pointer transition-colors',
                industry === ind
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Persona grid */}
        <div className="grid grid-cols-2 gap-3 overflow-y-auto">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); onClose() }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-[9px] border cursor-pointer text-left transition-colors',
                selected === p.id
                  ? 'border-brand bg-brand-tint'
                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100'
              )}
            >
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0', p.color)}>
                {p.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-[600] text-neutral-900 leading-5">{p.name}</div>
                <div className="text-[11px] text-neutral-500 leading-4">{p.role}</div>
                <div className="text-[11px] text-neutral-400 leading-4">{p.gender} · {p.language}</div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-[11.5px] text-neutral-400 text-center">
          Selecting a persona pairs a face + voice. You can customise both after.
        </p>
      </div>
    </div>
  )
}

/* ── Voice override confirmation dialog ── */
function VoiceOverrideDialog({ avatar, currentVoice, onConfirm, onCancel }: {
  avatar: Avatar
  currentVoice: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative w-[380px] bg-white rounded-[12px] shadow-2xl p-5 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[13.5px] font-[600] text-neutral-900">Replace voice?</div>
            <p className="text-[12.5px] text-neutral-600 leading-5">
              <span className="font-[500] text-neutral-900">{avatar.name}</span> is paired with{' '}
              <span className="font-[500] text-neutral-900">{avatar.pairedVoice}</span>.
              This will replace your current voice{' '}
              <span className="font-[500] text-neutral-900">({currentVoice})</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-8 px-3 rounded-[7px] border border-neutral-300 bg-white text-[12.5px] font-[500] text-neutral-700 hover:bg-neutral-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-8 px-3 rounded-[7px] bg-brand text-white text-[12.5px] font-[500] hover:opacity-90 cursor-pointer transition-opacity"
          >
            Replace voice &amp; apply avatar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Avatar section (shown in right column of Configuration) ── */
function AvatarSection() {
  const navigate = useNavigate()
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null)
  const [pendingAvatar, setPendingAvatar] = useState<Avatar | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [currentVoice, setCurrentVoice] = useState(CURRENT_VOICE)

  function handleAvatarPick(avatar: Avatar) {
    setDropdownOpen(false)
    if (avatar.pairedVoice !== currentVoice) {
      setPendingAvatar(avatar)
    } else {
      setSelectedAvatar(avatar)
    }
  }

  function confirmOverride() {
    if (!pendingAvatar) return
    setCurrentVoice(pendingAvatar.pairedVoice)
    setSelectedAvatar(pendingAvatar)
    setPendingAvatar(null)
  }

  return (
    <div className="flex flex-col gap-[17px]">
      <div className="flex items-center justify-between">
        <SectionHeading>Avatar</SectionHeading>
        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-brand-tint text-brand font-[600] tracking-wide uppercase">Beta</span>
      </div>

      {/* Dropdown — same pattern as Voice & Language */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="h-[30px] w-full flex items-center gap-2 pl-3 pr-2.5 rounded-[7.2px] border border-neutral-400 bg-neutral-100 hover:bg-neutral-200 cursor-pointer transition-colors"
        >
          {selectedAvatar ? (
            <>
              <span className="text-base leading-none">{selectedAvatar.emoji}</span>
              <span className="flex-1 min-w-0 text-left text-[13px] font-[500] text-neutral-900 truncate">
                {selectedAvatar.name} — {selectedAvatar.role}
              </span>
            </>
          ) : (
            <span className="flex-1 min-w-0 text-left text-[13px] font-[500] text-neutral-500 truncate">
              No avatar selected
            </span>
          )}
          <ChevronDown size={16} strokeWidth={1.33} className="text-neutral-900 shrink-0" />
        </button>

        {dropdownOpen && (
          <div className="absolute z-20 top-full mt-1 w-full rounded-[7.2px] border border-neutral-300 bg-white shadow-md overflow-hidden">
            {AVATARS.map(avatar => (
              <button
                key={avatar.id}
                onClick={() => handleAvatarPick(avatar)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-50 cursor-pointer transition-colors',
                  selectedAvatar?.id === avatar.id && 'bg-brand-tint'
                )}
              >
                <span className="text-base leading-none">{avatar.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-[500] text-neutral-900 truncate">{avatar.name} — {avatar.role}</div>
                  <div className="text-[11px] text-neutral-400 truncate">{avatar.pairedVoice}</div>
                </div>
              </button>
            ))}
            <div className="border-t border-neutral-100">
              <button
                onClick={() => { setDropdownOpen(false); navigate('/avatars/new') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <User size={14} className="text-neutral-400 shrink-0" />
                <span className="text-[12.5px] font-[500] text-neutral-600">Upload your own…</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedAvatar ? (
        <p className="text-[11.3px] text-neutral-600 leading-4">
          Voice: {selectedAvatar.pairedVoice}
        </p>
      ) : (
        <p className="text-[11.3px] text-neutral-500 leading-4">
          Avatars are paired with a voice. Selecting one may update your current voice.{' '}
          <button onClick={() => navigate('/avatars')} className="text-brand hover:underline cursor-pointer">
            Browse all →
          </button>
        </p>
      )}

      {pendingAvatar && (
        <VoiceOverrideDialog
          avatar={pendingAvatar}
          currentVoice={currentVoice}
          onConfirm={confirmOverride}
          onCancel={() => setPendingAvatar(null)}
        />
      )}
    </div>
  )
}

/* ── Right column: current (unchanged) ── */
function RightColumnCurrent({ languageDetection, setLanguageDetection }: {
  languageDetection: boolean
  setLanguageDetection: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-8 pt-2 min-w-0">
      <AvatarSection />
      <div className="flex flex-col gap-[17px]">
        <SectionHeading>Voice &amp; Language</SectionHeading>
        <button className="h-[30px] w-full flex items-center gap-2 pl-5 pr-2.5 rounded-[7.2px] border border-neutral-400 bg-neutral-100 hover:bg-neutral-200 cursor-pointer">
          <span className="text-base leading-none">🇺🇸</span>
          <span className="flex-1 min-w-0 text-left text-[13px] font-[500] text-neutral-900 truncate">Skylar - Friendly Guide</span>
          <ChevronDown size={16} strokeWidth={1.33} className="text-neutral-900 shrink-0" />
        </button>
        <p className="text-[11.3px] text-neutral-600 leading-4">Language: English</p>
      </div>
      <RightColumnASR languageDetection={languageDetection} setLanguageDetection={setLanguageDetection} />
      <RightColumnBgSound />
    </div>
  )
}

/* ── Right column: V1 — Persona card replaces Voice & Language ── */
function RightColumnV1({ languageDetection, setLanguageDetection }: {
  languageDetection: boolean
  setLanguageDetection: (v: boolean) => void
}) {
  const [personaId, setPersonaId] = useState<PersonaId>('skylar')
  return (
    <div className="flex flex-col gap-8 pt-2 min-w-0">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionHeading>Persona</SectionHeading>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-brand-tint text-brand font-[500]">New</span>
        </div>
        <PersonaCard personaId={personaId} onClick={() => {
          const next = PERSONAS[(PERSONAS.findIndex(p => p.id === personaId) + 1) % PERSONAS.length]
          setPersonaId(next.id)
        }} />
        <p className="text-[11px] text-neutral-400 leading-4">Face + voice are paired. Switching persona updates both.</p>
      </div>
      <RightColumnASR languageDetection={languageDetection} setLanguageDetection={setLanguageDetection} />
      <RightColumnBgSound />
    </div>
  )
}

/* ── Right column: V2 — Persona card + picker sheet ── */
function RightColumnV2({ languageDetection, setLanguageDetection }: {
  languageDetection: boolean
  setLanguageDetection: (v: boolean) => void
}) {
  const [personaId, setPersonaId] = useState<PersonaId>('skylar')
  const [sheetOpen, setSheetOpen] = useState(false)
  return (
    <div className="flex flex-col gap-8 pt-2 min-w-0">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionHeading>Persona</SectionHeading>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-brand-tint text-brand font-[500]">New</span>
        </div>
        <PersonaCard personaId={personaId} onClick={() => setSheetOpen(true)} />
        <p className="text-[11px] text-neutral-400 leading-4">Face + voice are paired. Switching persona updates both.</p>
      </div>
      <RightColumnASR languageDetection={languageDetection} setLanguageDetection={setLanguageDetection} />
      <RightColumnBgSound />
      {sheetOpen && (
        <PersonaPickerSheet
          selected={personaId}
          onSelect={setPersonaId}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}

/* ── Shared sub-sections ── */
function RightColumnASR({ languageDetection, setLanguageDetection }: {
  languageDetection: boolean
  setLanguageDetection: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading>Automatic Speech Recognition</SectionHeading>
      <div className="flex flex-col gap-2">
        <label className="text-[13.6px] font-[500] text-neutral-900 leading-[14px]">Model</label>
        <button className="h-8 w-full flex items-center justify-between pl-[11px] pr-2.5 rounded-[7.2px] border border-neutral-400 bg-neutral-100 hover:bg-neutral-200 cursor-pointer">
          <span className="text-[12.7px] text-neutral-900">Ink-2</span>
          <ChevronDown size={16} strokeWidth={1.33} className="text-neutral-600 shrink-0" />
        </button>
      </div>
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
  )
}

function RightColumnBgSound() {
  return (
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
  )
}

export function AgentConfigurationTab() {
  const [variation, setVariation] = useState<Variation>('current')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [initialMessage, setInitialMessage] = useState(DEFAULT_INITIAL_MESSAGE)
  const [skipIntro, setSkipIntro] = useState(false)
  const [languageDetection, setLanguageDetection] = useState(false)

  return (
    <div className="flex flex-col gap-4">

      {/* Header with variation switcher */}
      <div className="flex items-center justify-between">
        <h3 className="text-[19px] font-[600] text-neutral-900 leading-7">Configuration</h3>
        <div className="flex items-center gap-1 p-0.5 rounded-[8px] bg-neutral-100 border border-neutral-200">
          {(['current', 'v1', 'v2'] as Variation[]).map(v => (
            <button
              key={v}
              onClick={() => setVariation(v)}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11.5px] font-[500] cursor-pointer transition-colors',
                variation === v
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              {v === 'current' ? 'Current' : v === 'v1' ? 'Persona V1' : 'Persona V2'}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column grid (Figma 56:1398) */}
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8 items-start">

        {/* ── Left column (unchanged across all variations) ── */}
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

        {/* ── Right column — switches by variation ── */}
        {variation === 'current' && (
          <RightColumnCurrent languageDetection={languageDetection} setLanguageDetection={setLanguageDetection} />
        )}
        {variation === 'v1' && (
          <RightColumnV1 languageDetection={languageDetection} setLanguageDetection={setLanguageDetection} />
        )}
        {variation === 'v2' && (
          <RightColumnV2 languageDetection={languageDetection} setLanguageDetection={setLanguageDetection} />
        )}
      </div>
    </div>
  )
}
