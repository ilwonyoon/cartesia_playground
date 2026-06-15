import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, ArrowUp, Paperclip, Globe, FileText, Phone, ChevronLeft, ChevronRight, Ellipsis } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/Badge'
import { Spinner } from '../ui/Spinner'
import { useAgentBuilder } from '../../hooks/useAgentBuilder'
import { fetchWebsiteText, readTextFiles, summarizeBusinessMaterial, extractUrl, hostOf, type MaterialRead } from '../../lib/ingest'
import { useContent } from '../../content/store'
import { INDUSTRIES, otherUseCaseSeed, type IntakeIndustry } from '../../lib/builderIntake'
import type { VerifySignals } from '../../lib/builderPlaybook'
import type { AgentDraft, DraftPatch } from '../../lib/agentDraft'

/* ── Builder panel — "the best interface for building a voice agent is
   a voice agent" ────────────────────────────────────────────────────
   Lives inside the agent page's right preview panel. You talk; the
   real configuration form on the left fills in as a side effect
   (via onPatch). Ears Ink-2, voice Sonic-3, reasoning Claude. */

/* Five pulsing bars — same visual language as the preview panel's
   SpeakingDots (speakPulse keyframes live in index.css). */
function SpeakBars() {
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 14 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <span
          key={i}
          className="block w-[3px] rounded-full bg-brand"
          style={{
            height: 3 + (i === 2 ? 8 : i === 1 || i === 3 ? 5 : 0),
            animation: `speakPulse 0.9s ease-in-out ${i * 0.12}s infinite`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  )
}

function TurnIndicator({ turn, level, textMode, thinkingLabel }: { turn: 'listening' | 'thinking' | 'speaking'; level: number; textMode?: boolean; thinkingLabel?: string }) {
  const t = useContent()
  if (turn === 'thinking') {
    return (
      <span className="flex items-center gap-2 text-[12px] font-[500] text-neutral-600">
        <Spinner />
        {thinkingLabel ?? t('builder.turn.thinking')}
      </span>
    )
  }
  if (turn === 'speaking') {
    return (
      <span className="flex items-center gap-2 text-[12px] font-[500] text-neutral-600">
        <SpeakBars />
        {t('builder.turn.speaking')}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-2 text-[12px] font-[500] text-neutral-600">
      <span
        className="w-2.5 h-2.5 rounded-full bg-brand-light transition-transform duration-75"
        style={{ transform: `scale(${1 + Math.min(1, level) * 0.9})` }}
      />
      {textMode ? t('builder.turn.your-turn') : t('builder.turn.listening')}
    </span>
  )
}

function MessageRow({ role, content, dim }: { role: 'builder' | 'you'; content: string; dim?: boolean }) {
  const t = useContent()
  const isUser = role === 'you'
  return (
    <div className={cn('flex flex-col gap-0.5', isUser ? 'items-end' : 'items-start')}>
      <span className="text-[10.5px] font-[500] text-neutral-500 px-0.5">{isUser ? t('builder.role.you') : t('builder.role.builder')}</span>
      {isUser ? (
        <div className={cn(
          'max-w-[88%] px-3 py-2 rounded-[14px] rounded-tr-[4px] bg-neutral-900/10 text-neutral-900 text-[12.5px] leading-[1.45]',
          dim && 'opacity-60',
        )}>
          {content}
          {dim && <span className="inline-block w-[2px] h-[12px] bg-neutral-500 ml-1 align-middle animate-pulse" />}
        </div>
      ) : (
        <p className="max-w-[92%] text-neutral-800 text-[12.5px] leading-[1.5]">{content}</p>
      )}
    </div>
  )
}

const MATERIAL_RE = /\[?Business context (?:read )?from ([^\]:]+)\]?:/

function MaterialTurnRow({ content }: { content: string }) {
  const t = useContent()
  const match = MATERIAL_RE.exec(content)
  const label = match?.[1]?.trim() ?? ''
  const seed = content.slice(0, match?.index ?? 0).replace(/Website:\s*\S+\s*$/, '').trim()
  return (
    <div className="flex flex-col gap-1 items-end">
      <span className="text-[10.5px] font-[500] text-neutral-500 px-0.5">{t('builder.role.you')}</span>
      {seed && (
        <div className="max-w-[88%] px-3 py-2 rounded-[14px] rounded-tr-[4px] bg-neutral-900/10 text-neutral-900 text-[12.5px] leading-[1.45]">
          {seed}
        </div>
      )}
      <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-border-default bg-bg-control text-[11.5px] font-[500] text-neutral-600">
        <Paperclip size={12} strokeWidth={1.7} />
        {t('builder.attach.context-chip', { source: label })}
      </span>
    </div>
  )
}

function ThinkingRow({ label }: { label?: string }) {
  const t = useContent()
  return (
    <div className="flex flex-col gap-0.5 items-start">
      <span className="text-[10.5px] font-[500] text-neutral-500 px-0.5">{t('builder.role.builder')}</span>
      <div className="flex items-center gap-2 h-5 px-0.5">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-[5px] h-[5px] rounded-full bg-neutral-400"
              style={{ animation: `speakPulse 1s ease-in-out ${i * 0.18}s infinite` }}
            />
          ))}
        </div>
        {label && <span className="text-[11.5px] text-neutral-500">{label}</span>}
      </div>
    </div>
  )
}

/* Hero starting points — labels are product copy (keys); seed text stays
   English (it goes to the builder's LLM, not the screen). Chips PRE-FILL the
   composer so the user adds their business specifics before sending. */
const HERO_SEEDS: { labelKey: string; seed: string }[] = [
  { labelKey: 'builder.hero.seed.receptionist', seed: 'A receptionist that books, reschedules, and cancels appointments for my clinic. ' },
  { labelKey: 'builder.hero.seed.support', seed: 'An inbound support line that answers order, shipping, and return questions for my store. ' },
  { labelKey: 'builder.hero.seed.survey', seed: 'An outbound caller that runs a short satisfaction survey with recent customers. ' },
]
const HERO_EDIT_SEEDS: { labelKey: string; seed: string }[] = [
  { labelKey: 'builder.hero.seed.edit-voice', seed: 'Change the voice to ' },
  { labelKey: 'builder.hero.seed.edit-hours', seed: 'Update the business hours to ' },
  { labelKey: 'builder.hero.seed.edit-escalation', seed: 'Add an escalation path: transfer to a human at ' },
]

export function BuilderPanel({ onPatch, active, fixRequest, onFixConsumed, currentDraft, greeting, testCallActive, onStartTestCall, onRunSim, verifySignals }: {
  onPatch: (patch: DraftPatch) => void
  /** False while another preview tab covers the panel — pauses the mic. */
  active: boolean
  /** A repair instruction from the Eval list — sent to the builder as soon
      as the session can take a turn. */
  fixRequest?: string | null
  onFixConsumed?: () => void
  /** Existing agent config — the session starts as an EDIT of this. */
  currentDraft?: AgentDraft | null
  /** Opening line override (e.g. "Loaded X — what should change?"). */
  greeting?: string
  /** Preview lives inside the build loop: a test call can start from here,
      and the builder mic pauses while one runs (it must not transcribe it). */
  testCallActive?: boolean
  onStartTestCall?: () => void
  /** Runs the test-caller simulation from the conversation (VERIFY stage). */
  onRunSim?: () => void
  /** Console-known verification state — drives the playbook stage. */
  verifySignals?: VerifySignals
}) {
  const {
    sessionState, turnState, messages, partial, choices, done, error,
    micAvailable, voiceEnabled, stage, inputLevel, start, end, sendText, enableVoice,
  } = useAgentBuilder({ onPatch, paused: !active || !!testCallActive, initialDraft: currentDraft ?? null, greeting, verifySignals })

  const t = useContent()
  const [input, setInput] = useState('')
  const [heroText, setHeroText] = useState('')
  const [heroMode, setHeroMode] = useState<'describe' | 'url'>('describe')
  const [heroStage, setHeroStage] = useState<'intro' | 'industry' | 'usecase' | 'describe'>('intro')
  const [heroIndustry, setHeroIndustry] = useState<IntakeIndustry | null>(null)
  const [materialUrl, setMaterialUrl] = useState('')
  const [materialRead, setMaterialRead] = useState<{ read: MaterialRead; label: string } | null>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const [attachOpen, setAttachOpen] = useState(false)
  const [attachUrl, setAttachUrl] = useState('')
  const [ingesting, setIngesting] = useState<string | null>(null)
  const [ingestPhase, setIngestPhase] = useState<'reading' | 'summarizing'>('reading')
  const [ingestError, setIngestError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const attachRef = useRef<HTMLDivElement>(null)
  const live = sessionState === 'live'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setAttachOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* Ingest material → compact brief → one normal builder turn. The brain
     already knows to file concrete facts into the knowledge base. */
  async function ingestMaterial(label: string, loadRaw: () => Promise<string>, prefix = '') {
    setAttachOpen(false)
    setIngestError(null)
    setIngestPhase('reading')
    setIngesting(label)
    try {
      const raw = await loadRaw()
      setIngestPhase('summarizing')
      const read = await summarizeBusinessMaterial(label, raw)
      sendText(`${prefix}Business context from ${label}:\n${read.brief}\n\nUse this to refine the agent, and file the concrete facts into the knowledge base.`)
    } catch (err) {
      console.error('Ingestion failed:', err)
      setIngestError(err instanceof Error ? err.message : 'Could not read that material.')
    } finally {
      setIngesting(null)
    }
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, partial, turnState, ingesting, ingestPhase, choices, done])

  // Deviation fixes from the Eval list ride in as a normal user turn —
  // booting the session first if it isn't running yet.
  const fixBootedRef = useRef(false)
  useEffect(() => {
    if (!fixRequest) return
    if (sessionState === 'idle' && !fixBootedRef.current) {
      fixBootedRef.current = true
      void start({ voice: false })
      return
    }
    if (sessionState === 'live' && turnState === 'listening') {
      fixBootedRef.current = false
      sendText(fixRequest)
      onFixConsumed?.()
    }
  }, [fixRequest, sessionState, turnState, start, sendText, onFixConsumed])

  // Chat-style entry: a seed message auto-starts the session once, then
  // lands as the first user turn as soon as the builder is listening. If
  // the seed mentions a website, read it first so the first draft already
  // knows the business.
  const seedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!seedRef.current || sessionState !== 'live' || turnState !== 'listening') return
    const seed = seedRef.current
    seedRef.current = null
    const url = extractUrl(seed)
    if (!url) {
      sendText(seed)
      return
    }
    void (async () => {
      const label = hostOf(url)
      setIngestPhase('reading')
      setIngesting(label)
      try {
        const raw = await fetchWebsiteText(url)
        setIngestPhase('summarizing')
        const read = await summarizeBusinessMaterial(label, raw)
        sendText(`${seed}\n\n[Business context read from ${label}]:\n${read.brief}\n\nFile the concrete facts into the knowledge base.`)
      } catch (err) {
        console.error('Seed ingestion failed, proceeding without it:', err)
        sendText(seed)
      } finally {
        setIngesting(null)
      }
    })()
  }, [sessionState, turnState, sendText])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || turnState !== 'listening') return
    setInput('')
    sendText(text)
  }

  /* Every guided path funnels here: the seed becomes the opening user
     turn of a TEXT session (no mic prompt). When material was read on the
     hero, its brief rides in so the first draft is already business-coloured. */
  function startWithSeed(seed: string) {
    if (sessionState === 'connecting') return
    const m = materialRead
    seedRef.current = m
      ? `${seed}\n\n[Business context read from ${m.label}]:\n${m.read.brief}\n\nFile the concrete facts into the knowledge base.`
      : seed
    void start({ voice: false })
  }

  function heroSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = heroText.trim()
    if (!text) return
    setHeroText('')
    setHeroMode('describe')
    startWithSeed(text)
  }

  /* Step 1 → Step 2: read the material on the hero (so we accumulate
     context AND infer the industry), then route into the use-case step —
     the user still chooses the intent, now from a business-coloured start. */
  async function readMaterialThenChoose(label: string, loadRaw: () => Promise<string>) {
    setIngestError(null)
    setIngestPhase('reading')
    setIngesting(label)
    try {
      const raw = await loadRaw()
      setIngestPhase('summarizing')
      const read = await summarizeBusinessMaterial(label, raw)
      setMaterialRead({ read, label })
      const ind = INDUSTRIES.find(i => i.id === (read.industryId ?? 'other')) ?? INDUSTRIES[INDUSTRIES.length - 1]
      setHeroIndustry(ind)
      setHeroStage('usecase')
    } catch (err) {
      console.error('Hero material read failed:', err)
      setIngestError(err instanceof Error ? err.message : 'Could not read that material.')
    } finally {
      setIngesting(null)
    }
  }

  function handleHeroFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    const label = files.length === 1 ? files[0].name : `${files.length} files`
    void readMaterialThenChoose(label, () => readTextFiles(files))
  }

  if (!live) {
    const editing = !!currentDraft
    const seeds = editing ? HERO_EDIT_SEEDS : HERO_SEEDS

    if (sessionState === 'connecting') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 relative z-10">
          <Spinner size="md" />
          <p className="text-[12px] text-neutral-500">{t('builder.hero.connecting')}</p>
        </div>
      )
    }

    /* Step 1 — ONE primary action: hand me your material and I'll learn
       the business. Site or doc is the fastest, most accurate read of the
       industry; the guided questions are the fallback when neither exists.
       Reading happens HERE (not after the session starts) so the context
       feeds the use-case step and the first draft both. */
    if (!editing && heroStage === 'intro') {
      if (ingesting) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 relative z-10 text-center">
            <Spinner size="md" />
            <p className="text-[12.5px] font-[500] text-neutral-700">
              {t(ingestPhase === 'reading' ? 'builder.attach.reading' : 'builder.attach.summarizing', { source: ingesting })}
            </p>
            <p className="text-[11px] text-neutral-500 max-w-[260px]">{t('builder.intake.intro.reading-note')}</p>
          </div>
        )
      }
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-6 relative z-10 overflow-y-auto">
          <div className="flex flex-col gap-1.5 max-w-[320px] text-center">
            <p className="text-[16px] font-[500] text-neutral-900 leading-6 font-serif">
              {t('builder.intake.intro.title')}
            </p>
            <p className="text-[12px] text-neutral-500 leading-[1.5]">
              {t('builder.intake.intro.sub')}
            </p>
          </div>

          {(error || ingestError) && <p className="text-[11.5px] text-danger leading-4 max-w-[280px] text-center">{ingestError ?? error}</p>}

          {/* Primary: read the website */}
          <form
            onSubmit={e => {
              e.preventDefault()
              const url = materialUrl.trim()
              if (!url) return
              setMaterialUrl('')
              void readMaterialThenChoose(hostOf(url), () => fetchWebsiteText(url))
            }}
            className="relative w-full max-w-[320px]"
          >
            <Globe size={14} strokeWidth={1.7} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              value={materialUrl}
              onChange={e => setMaterialUrl(e.target.value)}
              placeholder={t('builder.intake.materials.url.placeholder')}
              className="w-full h-11 pl-9 pr-12 rounded-full border border-neutral-400 bg-white text-[13px] text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-neutral-600 text-left"
            />
            <button
              type="submit"
              disabled={!materialUrl.trim()}
              aria-label={t('builder.hero.action.website')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              <ArrowUp size={15} strokeWidth={2} />
            </button>
          </form>

          {/* Secondary: same action, other form — import a doc */}
          <label className="h-8 px-3.5 inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-control text-[12px] font-[500] text-neutral-700 hover:bg-bg-control-hover transition-colors cursor-pointer">
            <FileText size={13} strokeWidth={1.7} className="text-neutral-500" />
            {t('builder.hero.action.doc')}
            <input type="file" accept=".txt,.md" multiple className="hidden" onChange={handleHeroFiles} />
          </label>

          {/* Fallback: no material → step into the guided questions */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              onClick={() => setHeroStage('industry')}
              className="text-[12px] font-[500] text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              {t('builder.intake.intro.no-material')}
            </button>
            <button
              onClick={() => void start()}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-[500] text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            >
              <Mic size={12} strokeWidth={1.8} />
              {error ? t('builder.hero.retry') : t('builder.hero.talk')}
            </button>
          </div>

          <p className="text-[10.5px] text-neutral-400 leading-4">
            {t('builder.caption.stack')}
          </p>
        </div>
      )
    }

    /* Fallback step A — no material on hand: which industry? (back to intro) */
    if (!editing && heroStage === 'industry') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-6 relative z-10 overflow-y-auto">
          <div className="flex flex-col gap-1.5 max-w-[320px] text-center">
            <p className="text-[16px] font-[500] text-neutral-900 leading-6 font-serif">
              {t('builder.intake.industry.title')}
            </p>
            <p className="text-[12px] text-neutral-500 leading-[1.5]">
              {t('builder.intake.industry.sub')}
            </p>
          </div>

          {error && <p className="text-[11.5px] text-danger leading-4 max-w-[280px] text-center">{error}</p>}

          <div className="w-full max-w-[320px] flex flex-col gap-1.5">
            {INDUSTRIES.map(ind => (
              <button
                key={ind.id}
                onClick={() => { setHeroIndustry(ind); setHeroStage('usecase') }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-border-default bg-white hover:border-neutral-500 hover:bg-bg-control-hover transition-colors cursor-pointer text-left"
              >
                <span className="w-8 h-8 rounded-[8px] bg-brand-tint text-brand flex items-center justify-center shrink-0">
                  <ind.icon size={15} strokeWidth={1.8} />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[12.5px] font-[500] text-neutral-900 leading-4">{t(ind.labelKey)}</span>
                  <span className="text-[11px] text-neutral-500 leading-4 truncate">{t(ind.subKey)}</span>
                </span>
                <ChevronRight size={14} strokeWidth={1.5} className="ml-auto text-neutral-400 shrink-0" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setHeroStage('intro')}
            className="inline-flex items-center gap-1 text-[11.5px] font-[500] text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
          >
            <ChevronLeft size={13} strokeWidth={1.5} />
            {t('builder.intake.back')}
          </button>
        </div>
      )
    }

    if (!editing && heroStage === 'usecase' && heroIndustry) {
      /* Same intent question whether material was read or not — only the
         subhead changes: with material we reflect back what we learned
         ("Got it — Lakeview Dental") to prove we actually read it. */
      const fromMaterial = !!materialRead
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-6 relative z-10 overflow-y-auto">
          <div className="flex flex-col gap-1.5 max-w-[320px] text-center">
            <p className="text-[16px] font-[500] text-neutral-900 leading-6 font-serif">
              {t('builder.intake.usecase.title')}
            </p>
            <p className="text-[12px] text-neutral-500 leading-[1.5]">
              {fromMaterial
                ? t('builder.intake.usecase.read-sub', { name: materialRead?.read.businessName ?? materialRead?.label ?? '' })
                : t(heroIndustry.labelKey)}
            </p>
          </div>

          {error && <p className="text-[11.5px] text-danger leading-4 max-w-[280px] text-center">{error}</p>}

          <div className="w-full max-w-[320px] flex flex-col gap-1.5">
            {heroIndustry.useCases.map(uc => (
              <button
                key={uc.id}
                onClick={() => startWithSeed(uc.seed)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-border-default bg-white hover:border-neutral-500 hover:bg-bg-control-hover transition-colors cursor-pointer text-left"
              >
                <span className="w-7 h-7 rounded-[7px] bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0">
                  <uc.icon size={14} strokeWidth={1.7} />
                </span>
                <span className="text-[12.5px] font-[500] text-neutral-900 leading-4">{t(uc.labelKey)}</span>
              </button>
            ))}
            <button
              onClick={() => startWithSeed(otherUseCaseSeed(heroIndustry.id))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-dashed border-neutral-400 bg-transparent hover:border-neutral-500 hover:bg-bg-control-hover transition-colors cursor-pointer text-left"
            >
              <span className="w-7 h-7 rounded-[7px] bg-neutral-200 text-neutral-600 flex items-center justify-center shrink-0">
                <Ellipsis size={14} strokeWidth={1.7} />
              </span>
              <span className="text-[12.5px] font-[500] text-neutral-700 leading-4">{t('builder.intake.usecase.other')}</span>
            </button>
          </div>

          <button
            onClick={() => { setMaterialRead(null); setHeroStage(fromMaterial ? 'intro' : 'industry') }}
            className="inline-flex items-center gap-1 text-[11.5px] font-[500] text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
          >
            <ChevronLeft size={13} strokeWidth={1.5} />
            {t('builder.intake.back')}
          </button>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center relative z-10">
        {!editing && (
          <button
            onClick={() => { setHeroStage('intro'); setHeroMode('describe') }}
            className="inline-flex items-center gap-1 text-[11.5px] font-[500] text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
          >
            <ChevronLeft size={13} strokeWidth={1.5} />
            {t('builder.intake.back')}
          </button>
        )}
        <div className="flex flex-col gap-1.5 max-w-[300px]">
          <p className="text-[16px] font-[500] text-neutral-900 leading-6 font-serif">
            {editing ? t('builder.hero.title.edit') : t('builder.hero.title')}
          </p>
          <p className="text-[12px] text-neutral-500 leading-[1.5]">
            {editing ? t('builder.hero.sub.edit') : t('builder.hero.sub')}
          </p>
        </div>

        {error && <p className="text-[11.5px] text-danger leading-4 max-w-[280px]">{error}</p>}

        {/* Chat-first: typing is the default door; voice is one tap away */}
        <form onSubmit={heroSubmit} className="relative w-full max-w-[300px]">
          <input
            ref={heroInputRef}
            value={heroText}
            onChange={e => setHeroText(e.target.value)}
            placeholder={
              heroMode === 'url' ? t('builder.hero.composer.placeholder.url')
                : editing ? t('builder.hero.composer.placeholder.edit')
                : t('builder.hero.composer.placeholder')
            }
            className="w-full h-10 pl-4 pr-11 rounded-full border border-neutral-400 bg-white text-[12.5px] text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-neutral-600 text-left"
          />
          <button
            type="submit"
            disabled={!heroText.trim()}
            aria-label={t('builder.hero.title')}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            <ArrowUp size={14} strokeWidth={2} />
          </button>
        </form>

        {/* Start from material — the fastest path to a grounded agent */}
        <div className="flex flex-wrap justify-center gap-1.5 max-w-[320px]">
          <button
            onClick={() => {
              setHeroMode(m => (m === 'url' ? 'describe' : 'url'))
              heroInputRef.current?.focus()
            }}
            className={cn(
              'h-7 px-2.5 inline-flex items-center gap-1.5 rounded-[6px] border text-[12px] font-[500] transition-colors cursor-pointer',
              heroMode === 'url'
                ? 'border-brand bg-brand-tint text-brand'
                : 'border-border-default bg-bg-control text-neutral-700 hover:bg-bg-control-hover',
            )}
          >
            <Globe size={13} strokeWidth={1.7} className={heroMode === 'url' ? 'text-brand' : 'text-neutral-500'} />
            {t('builder.hero.action.website')}
          </button>
          <label className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-[6px] border border-border-default bg-bg-control text-[12px] font-[500] text-neutral-700 hover:bg-bg-control-hover transition-colors cursor-pointer">
            <FileText size={13} strokeWidth={1.7} className="text-neutral-500" />
            {t('builder.hero.action.doc')}
            <input type="file" accept=".txt,.md" multiple className="hidden" onChange={handleHeroFiles} />
          </label>
        </div>

        {/* Example agents — pre-fill, don't auto-send: the user adds their
            business specifics, then the conversation takes over. */}
        <div className="flex flex-wrap justify-center gap-1.5 max-w-[320px]">
          {seeds.map(({ labelKey, seed }) => (
            <button
              key={labelKey}
              onClick={() => {
                setHeroMode('describe')
                setHeroText(seed)
                heroInputRef.current?.focus()
              }}
              className="h-7 px-3 rounded-full border border-border-default bg-bg-control text-[12px] font-[500] text-neutral-700 hover:bg-bg-control-hover hover:border-neutral-500 transition-colors cursor-pointer"
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        <button
          onClick={() => void start()}
          className="inline-flex items-center gap-1.5 text-[12px] font-[500] text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          <Mic size={13} strokeWidth={1.8} />
          {error ? t('builder.hero.retry') : t('builder.hero.talk')}
        </button>

        <p className="text-[10.5px] text-neutral-400 leading-4">
          {t('builder.caption.stack')}
        </p>
      </div>
    )
  }

  /* What's actually happening right now — honest stages only: we know
     when we're reading material, summarizing it, and whether the next
     brain turn drafts (first turn, empty panel) or updates. */
  const builderTurns = messages.filter(m => m.role === 'builder').length
  const statusLabel = ingesting
    ? t(ingestPhase === 'reading' ? 'builder.attach.reading' : 'builder.attach.summarizing', { source: ingesting })
    : builderTurns <= 1 && !currentDraft
      ? t('builder.thinking.drafting')
      : t('builder.thinking.updating')

  return (
    <div className="flex-1 flex flex-col min-h-0 relative z-10">
      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map(m => (
          m.role === 'you' && MATERIAL_RE.test(m.content)
            ? <MaterialTurnRow key={m.id} content={m.content} />
            : <MessageRow key={m.id} role={m.role} content={m.content} />
        ))}
        {partial && <MessageRow role="you" content={partial} dim />}
        {(turnState === 'thinking' || ingesting) && <ThinkingRow label={statusLabel} />}
        {/* Quick replies live WITH the question, not pinned to the composer.
            Past DRAFT, the console's verification actions ride alongside —
            the builder coaches, the product executes. */}
        {turnState === 'listening' && !ingesting && (choices.length > 0 || (stage !== 'draft' && (onStartTestCall || onRunSim))) && (
          <div className="flex flex-wrap gap-1.5 pl-0.5">
            {stage !== 'draft' && onStartTestCall && !testCallActive && (
              <button
                onClick={onStartTestCall}
                className="h-7 pl-2.5 pr-3 inline-flex items-center gap-1.5 rounded-full bg-brand text-white text-[12px] font-[500] hover:bg-brand-light transition-colors cursor-pointer"
              >
                <Phone size={11} strokeWidth={0} fill="white" />
                {t('preview.bar.test-cta')}
              </button>
            )}
            {stage !== 'draft' && onRunSim && (
              <button
                onClick={onRunSim}
                disabled={verifySignals?.simRunning}
                className="h-7 px-3 inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-tint text-brand text-[12px] font-[500] hover:border-brand transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
              >
                {verifySignals?.simRunning ? <Spinner size="xs" /> : null}
                {verifySignals?.simRunning ? t('sim.running') : t('sim.run')}
              </button>
            )}
            {choices.map(choice => (
              <button
                key={choice}
                onClick={() => sendText(choice)}
                className="h-7 px-3 rounded-full border border-border-default bg-bg-control text-[12px] font-[500] text-neutral-800 hover:bg-bg-control-hover hover:border-neutral-500 transition-colors cursor-pointer"
              >
                {choice}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-neutral-400 px-3 py-2.5 flex flex-col gap-2 bg-neutral-100">
        {error && <p className="text-[11.5px] text-danger leading-4">{error}</p>}
        {ingestError && <p className="text-[11.5px] text-danger leading-4">{ingestError}</p>}

        {/* Quick replies — tap or just speak; both land as the same turn.
            When the draft is complete, previewing is offered right in the
            conversation: build → test is one loop. */}
        <div className="flex items-center justify-between gap-2">
          <TurnIndicator turn={ingesting ? 'thinking' : turnState} level={inputLevel} textMode={!voiceEnabled} thinkingLabel={statusLabel} />
          <div className="flex items-center gap-2">
            {!voiceEnabled && (
              <button
                onClick={() => void enableVoice()}
                className="inline-flex items-center gap-1 text-[11.5px] font-[500] text-neutral-600 hover:text-neutral-900 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Mic size={12} strokeWidth={1.7} />
                {t('builder.voice.enable')}
              </button>
            )}
            {voiceEnabled && !micAvailable && (
              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                <MicOff size={12} strokeWidth={1.5} />
                {t('builder.mic-unavailable')}
              </span>
            )}
            {done && <Badge size="sm">{t('builder.done-badge')}</Badge>}
            <button
              onClick={end}
              className="text-[11.5px] font-[500] text-neutral-500 hover:text-neutral-800 cursor-pointer transition-colors"
            >
              {t('builder.end')}
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          {/* Attach business material — website or text files */}
          <div ref={attachRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAttachOpen(v => !v)}
              disabled={turnState !== 'listening' || !!ingesting}
              aria-label="Attach business material"
              className={cn(
                'w-8 h-8 rounded-full border border-neutral-400 bg-white flex items-center justify-center text-neutral-600 transition-colors',
                attachOpen ? 'border-neutral-600 text-neutral-900' : 'hover:border-neutral-500 hover:text-neutral-800',
                'cursor-pointer disabled:opacity-40 disabled:cursor-default',
              )}
            >
              <Paperclip size={14} strokeWidth={1.7} />
            </button>

            {attachOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-[264px] bg-white border border-neutral-400 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-3 z-50 flex flex-col gap-2.5">
                <p className="text-[12px] font-[600] text-neutral-900 leading-4">{t('builder.attach.title')}</p>
                <div className="flex items-center gap-1.5">
                  <Globe size={14} strokeWidth={1.7} className="text-neutral-500 shrink-0" />
                  <input
                    value={attachUrl}
                    onChange={e => setAttachUrl(e.target.value)}
                    onKeyDown={e => {
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      const url = attachUrl.trim()
                      if (!url) return
                      setAttachUrl('')
                      void ingestMaterial(hostOf(url), () => fetchWebsiteText(url))
                    }}
                    placeholder={t('builder.attach.url.placeholder')}
                    className="flex-1 h-7 px-2.5 rounded-[6px] border border-neutral-400 bg-white text-[12px] text-neutral-900 outline-none focus:border-neutral-600 min-w-0"
                  />
                  <button
                    type="button"
                    disabled={!attachUrl.trim()}
                    onClick={() => {
                      const url = attachUrl.trim()
                      if (!url) return
                      setAttachUrl('')
                      void ingestMaterial(hostOf(url), () => fetchWebsiteText(url))
                    }}
                    className="h-7 px-2.5 rounded-[6px] bg-brand text-white text-[11.5px] font-[500] hover:bg-brand-light cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    {t('builder.attach.url.cta')}
                  </button>
                </div>
                <label className="flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] border border-border-default bg-bg-control text-[12px] font-[500] text-neutral-700 hover:bg-bg-control-hover cursor-pointer transition-colors">
                  <FileText size={13} strokeWidth={1.7} className="text-neutral-500 shrink-0" />
                  {t('builder.attach.files.cta')}
                  <input
                    type="file"
                    accept=".txt,.md"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = [...(e.target.files ?? [])]
                      e.target.value = ''
                      if (files.length === 0) return
                      const label = files.length === 1 ? files[0].name : `${files.length} files`
                      void ingestMaterial(label, () => readTextFiles(files))
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              turnState !== 'listening' ? t('builder.composer.placeholder.wait')
                : voiceEnabled ? t('builder.composer.placeholder.listening')
                : t('builder.composer.placeholder.text')
            }
            disabled={turnState !== 'listening'}
            className="flex-1 h-8 px-3 rounded-full border border-neutral-400 bg-white text-[12.5px] text-neutral-900 outline-none focus:border-neutral-600 disabled:opacity-60 min-w-0"
          />
          <button
            type="submit"
            disabled={!input.trim() || turnState !== 'listening'}
            className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default shrink-0"
          >
            <ArrowUp size={14} strokeWidth={2} />
          </button>
        </form>
        <p className="text-[10px] text-neutral-400 leading-3 text-center">
          {t('builder.caption.stack')}
        </p>
      </div>
    </div>
  )
}
