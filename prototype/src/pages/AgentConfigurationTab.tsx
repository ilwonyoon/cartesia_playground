import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Sparkles, Check, Upload, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { Toggle } from '../components/ui/Toggle'
import { AVATARS, type Avatar } from '../data/avatars'
import { VoicePickerModal } from '../components/voice/VoicePickerModal'
import { AvatarPickerModal } from '../components/avatar/AvatarPickerModal'
import { type Voice } from '../data/voices'

const CURRENT_VOICE = 'Skylar - Friendly Guide'

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

const DEFAULT_SYSTEM_PROMPT = `You are Priya, a voice banking assistant for First National Bank, powered by Cartesia. You help customers with everyday account needs over the phone — quickly, accurately, and without friction.

# Personality

Calm, warm, and professional. You're efficient but never robotic. You speak like a knowledgeable colleague at the bank, not a call-center script.

# Voice and tone

Use natural spoken language — contractions, brief acknowledgments, plain words.
Keep responses short: one to two sentences for most exchanges.
Never read account numbers, balances, or transaction details as a flat list — weave them into a sentence.
Never say "Great question!" or "Absolutely!" — just respond.

# What you can help with

Account balances and recent transactions — confirm identity first with last four digits of card or SSN.
Card services — report a lost or stolen card, request a replacement, toggle freeze on/off.
Dispute a charge — collect the merchant name, amount, and date; confirm you've opened a case.
Transfer funds between accounts — confirm source, destination, and amount before executing.
General questions — interest rates, branch hours, fee schedules, online banking access.

# Security

Always verify identity before sharing any account-specific information.
Ask: "Can you confirm the last four digits of your card or Social Security number?"
If verification fails twice, offer to transfer to a live agent.
Never read a full card number, SSN, or password back to the caller.

# Handling common situations

Caller can't verify identity: "I'm not able to access account details without verification — I can connect you with a specialist if you'd like."
Caller is frustrated: Acknowledge it briefly, move to a solution. "I understand — let me sort that out for you."
Complex dispute or fraud: "I'm going to escalate this to our fraud team. Can I confirm your callback number?"
Didn't catch something: "Sorry, I missed that — could you repeat the last part?"

## end_call
When the caller says goodbye or the issue is resolved, confirm briefly and end: "Take care — have a good one." Then call end_call.`

const DEFAULT_INITIAL_MESSAGE = `Hi, you've reached First National Bank. I'm Priya, your virtual banking assistant. I can help with your balance, recent transactions, card services, or transfers. What can I do for you today?`

/* Section heading shared across the form (Figma "Heading 2"). */
function SectionHeading({ children, info }: { children: React.ReactNode; info?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-[13.3px] font-[500] text-neutral-900 leading-5">{children}</h2>
      {info && <InfoButton />}
    </div>
  )
}

/* ── Voice override confirmation dialog ── */
function VoiceOverrideDialog({ avatar, newVoice, currentVoice, onConfirm, onCancel }: {
  avatar: Avatar
  newVoice: string
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
              Applying <span className="font-[500] text-neutral-900">{avatar.name}</span> with{' '}
              <span className="font-[500] text-neutral-900">{newVoice}</span>.
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

/* ── Avatar section (shown in right column of Configuration) ──
   The field opens a 2-panel picker (live preview + JTBD-grouped faces).
   Face+voice are paired: confirming a face whose voice differs from the
   agent's current voice routes through VoiceOverrideDialog. */
function AvatarSection({ systemPrompt, initialMessage, selectedAvatar, onSelectAvatar }: {
  systemPrompt: string
  initialMessage: string
  selectedAvatar: Avatar | null
  onSelectAvatar: (avatar: Avatar | null) => void
}) {
  const navigate = useNavigate()
  // Voice the user actually picked (may differ from the avatar's paired voice).
  const [selectedVoice, setSelectedVoice] = useState<string>(CURRENT_VOICE)
  const [pending, setPending] = useState<{ avatar: Avatar; voiceLabel: string } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentVoice, setCurrentVoice] = useState(CURRENT_VOICE)

  function handleConfirmFromModal(avatar: Avatar, voiceLabel: string) {
    setModalOpen(false)
    if (voiceLabel !== currentVoice) {
      setPending({ avatar, voiceLabel })
    } else {
      onSelectAvatar(avatar)
      setSelectedVoice(voiceLabel)
    }
  }

  function confirmOverride() {
    if (!pending) return
    setCurrentVoice(pending.voiceLabel)
    onSelectAvatar(pending.avatar)
    setSelectedVoice(pending.voiceLabel)
    setPending(null)
  }

  return (
    <div className="flex flex-col gap-[17px]">
      <div className="flex items-center gap-2">
        <SectionHeading>Avatar</SectionHeading>
        <span className="inline-flex items-center h-5 px-2 rounded-full bg-neutral-900 text-white text-[11px] font-[500] leading-none">New</span>
      </div>

      {/* Field trigger — opens the picker modal */}
      <button
        onClick={() => setModalOpen(true)}
        className="h-[30px] w-full flex items-center gap-2 pl-3 pr-2.5 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover cursor-pointer transition-colors"
      >
        {selectedAvatar ? (
          <>
            {selectedAvatar.imageUrl
              ? <img src={selectedAvatar.imageUrl} alt={selectedAvatar.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
              : <span className="text-base leading-none">{selectedAvatar.emoji}</span>}
            <span className="flex-1 min-w-0 text-left text-[13px] font-[500] text-neutral-900 truncate">
              {selectedAvatar.name} — {selectedAvatar.role}
            </span>
          </>
        ) : (
          <>
            {/* Stacked faces hint that a gallery is one click away */}
            <span className="flex items-center -space-x-1.5 shrink-0">
              {AVATARS.filter(a => a.imageUrl).slice(0, 3).map(a => (
                <img
                  key={a.id}
                  src={a.imageUrl}
                  alt=""
                  className="w-[18px] h-[18px] rounded-full object-cover ring-[1.5px] ring-bg-control"
                />
              ))}
            </span>
            <span className="flex-1 min-w-0 text-left text-[13px] font-[500] text-neutral-500 truncate">
              Select an avatar
            </span>
          </>
        )}
        <ChevronDown size={16} strokeWidth={1.33} className="text-neutral-900 shrink-0" />
      </button>

      {selectedAvatar ? (
        <p className="text-[11.3px] text-neutral-600 leading-4">
          Voice: {selectedVoice}
        </p>
      ) : (
        <p className="text-[11.3px] text-neutral-500 leading-4">
          Avatars are paired with a voice. Selecting one may update your current voice.{' '}
          <button onClick={() => navigate('/avatars')} className="text-brand hover:underline cursor-pointer">
            Browse all →
          </button>
        </p>
      )}

      <AvatarPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentVoice={currentVoice}
        selectedAvatarId={selectedAvatar?.id}
        onConfirm={handleConfirmFromModal}
        systemPrompt={systemPrompt}
        initialMessage={initialMessage}
      />

      {pending && (
        <VoiceOverrideDialog
          avatar={pending.avatar}
          newVoice={pending.voiceLabel}
          currentVoice={currentVoice}
          onConfirm={confirmOverride}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}

/* ── Right column: current ── */
function RightColumnCurrent({ languageDetection, setLanguageDetection, systemPrompt, initialMessage, selectedAvatar, onSelectAvatar }: {
  languageDetection: boolean
  setLanguageDetection: (v: boolean) => void
  systemPrompt: string
  initialMessage: string
  selectedAvatar: Avatar | null
  onSelectAvatar: (avatar: Avatar | null) => void
}) {
  // Default to Skylar (matches CURRENT_VOICE); the picker modal swaps it.
  const [voice, setVoice] = useState<Voice>({
    id: 'v1', name: 'Skylar', tag: 'Friendly Guide',
    desc: 'Approachable American female ideal for customer care and support.',
    flag: '🇺🇸', language: 'English', accent: 'American', gender: 'Feminine', verified: true,
  })
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="flex flex-col gap-8 pt-2 min-w-0">
      <AvatarSection systemPrompt={systemPrompt} initialMessage={initialMessage} selectedAvatar={selectedAvatar} onSelectAvatar={onSelectAvatar} />
      <div className="flex flex-col gap-[17px]">
        <SectionHeading>Voice &amp; Language</SectionHeading>
        <button
          onClick={() => setPickerOpen(true)}
          className="h-[30px] w-full flex items-center gap-2 pl-5 pr-2.5 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover cursor-pointer"
        >
          <span className="text-base leading-none">{voice.flag}</span>
          <span className="flex-1 min-w-0 text-left text-[13px] font-[500] text-neutral-900 truncate">{voice.name} - {voice.tag}</span>
          <ChevronDown size={16} strokeWidth={1.33} className="text-neutral-900 shrink-0" />
        </button>
        <p className="text-[11.3px] text-neutral-600 leading-4">Language: {voice.language}</p>
      </div>
      <RightColumnASR languageDetection={languageDetection} setLanguageDetection={setLanguageDetection} />
      <RightColumnBgSound />

      <VoicePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={setVoice}
      />
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
        <button className="h-8 w-full flex items-center justify-between pl-[11px] pr-2.5 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover cursor-pointer">
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
      <button className="h-[30px] w-full flex items-center gap-3 pl-5 pr-2.5 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover cursor-pointer">
        <span className="text-[13.6px] font-[500] text-neutral-700 leading-5 shrink-0">Choose File</span>
        <span className="flex-1 min-w-0 text-left text-[13.3px] font-[500] text-neutral-500 leading-5 truncate">No file chosen</span>
        <Upload size={16} strokeWidth={1.33} className="text-neutral-900 shrink-0" />
      </button>
    </div>
  )
}

export function AgentConfigurationTab({ selectedAvatar, onSelectAvatar }: {
  selectedAvatar: Avatar | null
  onSelectAvatar: (avatar: Avatar | null) => void
}) {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [initialMessage, setInitialMessage] = useState(DEFAULT_INITIAL_MESSAGE)
  const [skipIntro, setSkipIntro] = useState(false)
  const [languageDetection, setLanguageDetection] = useState(false)

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
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
        <RightColumnCurrent languageDetection={languageDetection} setLanguageDetection={setLanguageDetection} systemPrompt={systemPrompt} initialMessage={initialMessage} selectedAvatar={selectedAvatar} onSelectAvatar={onSelectAvatar} />
      </div>
    </div>
  )
}
