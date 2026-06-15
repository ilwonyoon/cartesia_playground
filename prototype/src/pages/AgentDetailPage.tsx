import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Phone, GitBranch,
  ExternalLink, MoreVertical, X, Globe, Hash, AlertCircle,
  FileText, Info,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { AgentConfigurationTab } from './AgentConfigurationTab'
import { useVoiceAgent } from '../hooks/useVoiceAgent'
import { AnamPreview } from '../components/avatar/AnamPreview'
import { CodeBlock, type CodeLang } from '../components/ui/CodeBlock'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import type { Avatar } from '../data/avatars'
import { VOICES, type Voice } from '../data/voices'
import { BuilderPanel } from '../components/builder/BuilderPanel'
import { FlowCanvas } from '../components/flow/FlowCanvas'
import { DEMO_FLOW, type AgentFlow } from '../lib/agentFlow'
import { traceCall, type TraceTurn } from '../lib/flowTracer'
import { simulateCall, SIM_PERSONAS, type SimPersona, type SimResult } from '../lib/simulator'
import type { VerifySignals } from '../lib/builderPlaybook'
import { getAgent, upsertAgent, removeAgent } from '../lib/agentStore'
import { useContent } from '../content/store'
import { upsertDocs, type AgentDraft, type DraftPatch, type KnowledgeDoc } from '../lib/agentDraft'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_INITIAL_MESSAGE } from './AgentConfigurationTab'

/* ── Agent detail (Figma 56:1715 / structural ref 77:550) ─────────────
   Re-architected into the ElevenLabs-style 2-zone shell:

     ┌ main column ───────────────────────────┐┌ preview ┐
     │ header   (left: identity · right: …)    ││ (docks  │
     │ tabs     (LEFT-aligned, scrolls)        ││  full-  │
     │ content  (centered max-w column)        ││  height)│
     └─────────────────────────────────────────┘└─────────┘

   The preview panel docks full-height on the right when toggled from the
   header's "Preview" action, narrowing the main column (content reflows).
   Colors stay on Cartesia tokens — brand green, warm neutrals — never the
   reference's black Publish / blue-yellow badges. */

/* Sections live in the URL (and the agent-scoped sidebar) — the page no
   longer draws its own horizontal tab bar. */
const TAB_TO_SLUG = {
  Configuration: 'configuration',
  Flow: 'flow',
  Deployment: 'deployment',
  Widget: 'widget',
  Environment: 'environment',
  'Knowledge Base': 'knowledge-base',
  Metrics: 'metrics',
  Calls: 'calls',
  Settings: 'settings',
} as const
type Tab = keyof typeof TAB_TO_SLUG
const SLUG_TO_TAB = Object.fromEntries(
  Object.entries(TAB_TO_SLUG).map(([tab, slug]) => [slug, tab as Tab]),
) as Record<string, Tab>

const AGENT = {
  name: 'open-dialogue',
  id: 'agent_eb6t2Jqe8jNhyZYbX2gzpn',
  branch: 'main',
  phoneNumber: '+1 (507) 765-0833',
}

/* Production version summary (Figma 56:1784). */
const PRODUCTION = {
  version: 'av_2ftEmVWpM7MNJ3e9PFPFdh',
  status: 'Deployed',
  deployed: '9m ago',
  webhook: 'None',
}

/* Version history rows (Figma 56:1823). */
type Version = {
  id: string
  status: 'Deployed'
  ago: string
  production?: boolean
}
const VERSIONS: Version[] = [
  { id: 'av_2ftEmVWpM7MNJ3e9PFPFdh', status: 'Deployed', ago: '9m ago', production: true },
  { id: 'av_P7us5ZA26HHbtBbpnDsG1G', status: 'Deployed', ago: '21m ago' },
]

/* Green status dot with white ring (Figma Overlay+Shadow). */
function StatusDot({ size = 12 }: { size?: number }) {
  return (
    <span className="relative inline-block rounded-full shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full shadow-[0px_0px_0px_1px_white]" />
      <span className="block w-full h-full rounded-full bg-brand-light" />
    </span>
  )
}

/* One info field in the Production Version card. */
function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11.3px] font-[500] text-neutral-500 leading-4">{label}</p>
      <div className="leading-5">{children}</div>
    </div>
  )
}

/* One Version History row. */
function VersionRow({ version, last }: { version: Version; last?: boolean }) {
  const t = useContent()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={cn('min-h-[90px] flex items-center px-1', !last && 'border-b border-neutral-400')}>
      {/* Expand chevron */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-7 h-7 flex items-center justify-center rounded-[5.76px] hover:bg-black/5 shrink-0 cursor-pointer ml-1"
      >
        <ChevronRight size={16} strokeWidth={1.33} className={cn('text-neutral-900 transition-transform', expanded && 'rotate-90')} />
      </button>

      {/* Version id + Production badge */}
      <div className="flex-1 min-w-0 pl-2 pr-2">
        <p className="font-mono text-[14px] font-[500] text-neutral-900 leading-5 truncate">{version.id}</p>
        {version.production && (
          <div className="pt-2">
            <Badge>{t('deploy.badge.production')}</Badge>
          </div>
        )}
      </div>

      {/* Status + ago */}
      <div className="w-[260px] shrink-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <StatusDot />
          <span className="text-[13.9px] text-neutral-900 leading-5">{version.status}</span>
        </div>
        <span className="pl-[21px] text-[11.5px] text-neutral-600 leading-4">{version.ago}</span>
      </div>

      {/* Kebab */}
      <button className="w-7 h-7 flex items-center justify-center rounded-[5.76px] hover:bg-black/5 shrink-0 cursor-pointer mr-2">
        <MoreVertical size={16} strokeWidth={1.33} className="text-neutral-900" />
      </button>
    </div>
  )
}

/* Scrolling history waveform — Figma spec: 4px bar, 4px gap, 48px tall, gradient fill */
function Waveform({ amplitude, active = true, variant = 'agent' }: {
  amplitude: number; active?: boolean; variant?: 'agent' | 'user'
}) {
  const BAR_W = 4
  const PITCH = 8
  const H = 48
  const MS_PER_BAR = 190

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const historyRef = useRef<number[]>([])
  const rafRef = useRef<number>(0)
  const lastTickRef = useRef(0)
  const barsRef = useRef(52)
  // Use refs for live values so the RAF closure always reads the latest
  const amplitudeRef = useRef(amplitude)
  const activeRef = useRef(active)
  useEffect(() => { amplitudeRef.current = amplitude }, [amplitude])
  useEffect(() => { activeRef.current = active }, [active])

  // Figma gradient stops (bottom→top = stop 0→1 in createLinearGradient(0,y+h,0,y))
  // Agent: #40A93C 22% → #40A93C 55% → #3A9438 100%
  // User:  #00598A 22% → #0084D1 55% → #00A6F4 100%
  const colors = variant === 'agent'
    ? { s0: 'rgba(64,169,60,0.22)', s1: 'rgba(64,169,60,0.55)', s2: '#3A9438', silent: 'rgba(64,169,60,0.22)' }
    : { s0: 'rgba(0,89,138,0.22)',  s1: 'rgba(0,132,209,0.55)', s2: '#00A6F4', silent: 'rgba(0,132,209,0.18)' }

  // Resize: recalculate bar count from container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width)
      const canvas = canvasRef.current
      if (!canvas) return
      const bars = Math.max(1, Math.floor(w / PITCH))
      barsRef.current = bars
      canvas.width = w
      canvas.height = H
      while (historyRef.current.length > bars) historyRef.current.shift()
      while (historyRef.current.length < bars) historyRef.current.unshift(0)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Single persistent RAF loop — reads live values from refs, never restarts
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = (now: number) => {
      if (now - lastTickRef.current > MS_PER_BAR) {
        lastTickRef.current = now
        const amp = activeRef.current ? amplitudeRef.current : 0
        historyRef.current.push(amp)
        while (historyRef.current.length > barsRef.current) historyRef.current.shift()
      }

      const W = canvas.width
      ctx.clearRect(0, 0, W, H)
      const midY = H / 2

      historyRef.current.forEach((s, i) => {
        const barH = s > 0.01 ? Math.min(44, Math.max(4, s * 44)) : 4
        const x = i * PITCH
        const y = midY - barH / 2

        if (s > 0.01) {
          // bottom→top gradient: stop 0 at bottom (y+barH), stop 1 at top (y)
          const grad = ctx.createLinearGradient(0, y + barH, 0, y)
          grad.addColorStop(0, colors.s0)
          grad.addColorStop(0.5, colors.s1)
          grad.addColorStop(1, colors.s2)
          ctx.fillStyle = grad
        } else {
          ctx.fillStyle = colors.silent
        }
        ctx.beginPath()
        ctx.roundRect(x, y, BAR_W, barH, 2)
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // intentionally empty — reads live data via refs

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <canvas ref={canvasRef} height={H} style={{ display: 'block', width: '100%' }} />
    </div>
  )
}

function MicIcon({ muted, size = 20 }: { muted: boolean; size?: number }) {
  return muted ? (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 3L17 17M10 2a3 3 0 013 3v3l-8-8a3 3 0 015-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 7v3a3 3 0 005.23 2.02M5.27 9A5 5 0 0015 9M10 17v2M7 19h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="7" y="1" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 9a6 6 0 0012 0M10 17v2M7 19h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function useDuration(active: boolean) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!active) { setSecs(0); return }
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [active])
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/* ── Bottom test bar — ElevenLabs-style: test the agent from ANY tab ──
   Slim resting bar; expands into a live-call strip while a browser call
   runs. The phone number + Call▾ moved down here from the header. The
   live transcript still feeds the Observability tracer. */
function BottomTestBar({ agentName, callState, talkState, agentAmplitude, error, muted, phoneNumber, onStart, onEnd, onToggleMute }: {
  agentName: string
  callState: 'idle' | 'connecting' | 'active' | 'error'
  talkState: 'speaking' | 'listening'
  agentAmplitude: number
  error: string | null
  muted: boolean
  /** The agent's assigned inbound number, if provisioned — shown beside the hint. */
  phoneNumber?: string | null
  onStart: () => void
  onEnd: () => void
  onToggleMute: () => void
}) {
  const t = useContent()
  const duration = useDuration(callState === 'active')
  const [callMenuOpen, setCallMenuOpen] = useState(false)
  const [callTo, setCallTo] = useState('+1')
  const callMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (callMenuRef.current && !callMenuRef.current.contains(e.target as Node)) setCallMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isActive = callState === 'active'
  const isConnecting = callState === 'connecting'

  return (
    <div className="shrink-0 h-[60px] border-t border-neutral-400 bg-neutral-100">
      {/* Mirrors the tab content's container (padding INSIDE max-w-1200) so
          the controls left-align with the page title, not the panel edge */}
      <div className="max-w-[1200px] w-full mx-auto h-full px-4 md:px-9 flex items-center gap-3">
      {isActive ? (
        /* Live-call strip — compact, grouped, fixed-width wave */
        <>
          <button
            onClick={onToggleMute}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-[0px_0px_0px_1px_rgba(10,10,10,0.08)]',
              muted ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700',
            )}
          >
            <MicIcon muted={muted} size={16} />
          </button>
          <div className="flex flex-col min-w-0 shrink-0 max-w-[200px]">
            <span className="text-[12.5px] font-[600] text-neutral-900 leading-4 truncate">{agentName}</span>
            <span className="text-[11px] text-neutral-500 leading-4 tabular-nums">{t('preview.phone.live-call')} · {duration}</span>
          </div>
          <div className="flex-1 hidden sm:block" />
          <div className="w-[200px] shrink-0 hidden sm:block">
            <Waveform amplitude={agentAmplitude} active={talkState === 'speaking'} variant="agent" />
          </div>
          <span className="hidden md:flex items-center gap-1.5 text-[11px] text-neutral-500 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#00d492', opacity: talkState === 'speaking' ? 1 : 0.35 }} />
            {t('preview.phone.agent-speaking')}
          </span>
          <div className="flex-1 sm:flex-none md:flex-1" />
          <button
            onClick={onEnd}
            className="w-9 h-9 rounded-full bg-[#fb2c36] flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Phone size={15} strokeWidth={0} fill="white" className="rotate-[135deg]" />
          </button>
        </>
      ) : (
        /* Idle — ONE control: test in the browser, or ▾ send the same call to
           a real phone. Same act, two transports. */
        <>
          <div ref={callMenuRef} className="relative shrink-0">
            <div className="flex gap-px">
              <button
                onClick={onStart}
                disabled={isConnecting}
                className="h-8 pl-3 pr-3 inline-flex items-center gap-2 rounded-l-full bg-brand text-white text-[12.5px] font-[500] hover:bg-brand-light transition-colors cursor-pointer disabled:opacity-60"
              >
                {isConnecting ? <Spinner tone="inverse" size="xs" /> : <Phone size={13} strokeWidth={0} fill="white" />}
                {isConnecting ? t('builder.hero.connecting') : t('preview.bar.test-cta')}
              </button>
              <button
                onClick={() => setCallMenuOpen(v => !v)}
                aria-label={t('agent.header.send-call')}
                className="h-8 w-7 rounded-r-full bg-brand text-white flex items-center justify-center hover:bg-brand-light transition-colors cursor-pointer"
              >
                <ChevronDown size={13} strokeWidth={1.5} className={cn('transition-transform', callMenuOpen && 'rotate-180')} />
              </button>
            </div>

            {callMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1.5 w-[260px] bg-white border border-neutral-400 rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-3 z-50">
                <p className="text-[12.5px] font-[600] text-neutral-900 mb-1">{t('agent.header.send-call')}</p>
                {phoneNumber && (
                  <p className="text-[11px] text-neutral-500 mb-2 flex items-center gap-1">
                    <Hash size={11} strokeWidth={1.5} className="shrink-0" />
                    {phoneNumber}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={callTo}
                    onChange={e => setCallTo(e.target.value)}
                    className="flex-1 h-8 px-3 rounded-[6px] border border-neutral-400 bg-white text-[13px] text-neutral-900 outline-none focus:border-neutral-600 min-w-0"
                  />
                  <button className="w-8 h-8 flex items-center justify-center rounded-[6px] bg-brand text-white hover:bg-brand-light transition-colors cursor-pointer shrink-0">
                    <Phone size={14} strokeWidth={0} fill="currentColor" />
                  </button>
                </div>
              </div>
            )}
          </div>
          {phoneNumber && (
            <span className="hidden lg:inline-flex h-8 px-3 items-center gap-1.5 rounded-full border border-neutral-400 bg-white text-[12.5px] font-[500] text-neutral-600 whitespace-nowrap shrink-0">
              <Hash size={13} strokeWidth={1.5} className="text-neutral-500 shrink-0" />
              {phoneNumber}
            </span>
          )}
          <span className="text-[12px] text-neutral-500 truncate min-w-0 hidden sm:block">
            {error ? <span className="text-danger">{error}</span> : t('preview.phone.test-sub', { name: agentName })}
          </span>
        </>
      )}
      </div>
    </div>
  )
}

/* ── Build dock — the conversational builder, docked right ──────────
   Chat is the standing companion pane (Cursor-style); testing moved to
   the bottom bar, so the dock is honestly named and single-purpose. */
function BuildDock({ onClose, onBuilderPatch, fixRequest, onFixConsumed, currentDraft, builderGreeting, testCallActive, onStartTestCall, onRunSim, verifySignals }: {
  onClose: () => void
  onBuilderPatch?: (patch: DraftPatch) => void
  fixRequest?: string | null
  onFixConsumed?: () => void
  currentDraft?: AgentDraft | null
  builderGreeting?: string
  /** Preview lives INSIDE the build loop too: the panel offers a test
      call, and the builder mic pauses while one runs. */
  testCallActive?: boolean
  onStartTestCall?: () => void
  onRunSim?: () => void
  verifySignals?: VerifySignals
}) {
  const t = useContent()
  return (
    <aside className="w-full md:w-[400px] shrink-0 flex flex-col h-full border-l border-neutral-400 bg-neutral-100">
      <div className="h-[48px] shrink-0 flex items-center justify-between gap-2 px-4 border-b border-neutral-400">
        <h2 className="text-[13.6px] font-[600] text-neutral-900">{t('preview.tab.build')}</h2>
        <div className="flex items-center gap-1.5">
          {onStartTestCall && (
            <button
              onClick={onStartTestCall}
              disabled={testCallActive}
              className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-[6px] border border-border-default bg-bg-control text-[12px] font-[500] text-neutral-700 hover:bg-bg-control-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              <Phone size={11} strokeWidth={1.7} />
              {t('preview.bar.test-cta')}
            </button>
          )}
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-[5.76px] hover:bg-neutral-200 cursor-pointer">
            <X size={16} strokeWidth={1.5} className="text-neutral-600" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0" style={{backgroundImage: 'linear-gradient(rgba(0,0,0,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.018) 1px, transparent 1px)', backgroundSize: '7px 7px', backgroundPosition: '3.5px 3.5px'}} />
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <BuilderPanel
            onPatch={onBuilderPatch ?? (() => {})}
            active
            fixRequest={fixRequest}
            onFixConsumed={onFixConsumed}
            currentDraft={currentDraft}
            greeting={builderGreeting}
            testCallActive={testCallActive}
            onStartTestCall={onStartTestCall}
            onRunSim={onRunSim}
            verifySignals={verifySignals}
          />
        </div>
      </div>
    </aside>
  )
}

/* Read-only chip showing a channel the live version is serving. Both channels
   use the same neutral style — being live is equal-weight info, not an accent. */
function ChannelChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-[22px] pl-2 pr-2.5 rounded-full border border-neutral-400 bg-neutral-200 text-neutral-700 text-[11.8px] font-[500] leading-4">
      {icon}
      {label}
    </span>
  )
}

/* Embed formats Cartesia actually supports for connecting a client to a
   deployed agent (verified against docs.cartesia.ai/line + the cartesia/line
   SDKs). There is no drop-in <script> web component — the real web path is the
   raw WebSocket. JS/Python mint the token + open it; LiveKit/Pipecat are
   partner model-integrations. No fictional <cartesia-agent> element. */
type EmbedFormat = {
  key: string
  label: string
  lang: CodeLang
  partner?: boolean
  docs: string
  snippet: (agentId: string) => string
}

const EMBED_FORMATS: EmbedFormat[] = [
  {
    key: 'websocket', label: 'WebSocket', lang: 'js', docs: 'WebSocket API docs',
    snippet: id => `// Mint an agent access token server-side, then connect.
const ws = new WebSocket(
  "wss://api.cartesia.ai/agents/stream/${id}",
  { headers: {
    Authorization: \`Bearer \${accessToken}\`,
    "Cartesia-Version": "2025-04-16",
  }}
)
ws.onopen = () => ws.send(JSON.stringify({
  event: "start",
  config: { input_format: "pcm_44100" },
}))`,
  },
  {
    key: 'js', label: 'JavaScript', lang: 'js', docs: 'JS SDK docs',
    snippet: id => `import { CartesiaClient } from "@cartesia/cartesia-js"

// Server-side: mint a short-lived agent token for the browser.
const client = new CartesiaClient({ apiKey: process.env.CARTESIA_API_KEY })
const { token } = await client.accessToken.create({
  grants: { agent: true },
  agentId: "${id}",
})
// Hand \`token\` to the client and open the WebSocket above.`,
  },
  {
    key: 'python', label: 'Python', lang: 'python', docs: 'Line SDK docs',
    snippet: () => `from line import LlmAgent, VoiceAgentApp

# The agent runtime you deploy with \`cartesia deploy\`.
agent = LlmAgent(system_prompt="…")
app = VoiceAgentApp(agent)

# Clients reach the deployed agent over the WebSocket API.`,
  },
  {
    key: 'livekit', label: 'LiveKit', lang: 'python', partner: true, docs: 'LiveKit integration',
    snippet: () => `from livekit.plugins import cartesia

# Use Cartesia's voice inside a LiveKit Agents pipeline.
session = AgentSession(
  tts=cartesia.TTS(model="sonic-3", voice="…"),
)`,
  },
  {
    key: 'pipecat', label: 'Pipecat', lang: 'python', partner: true, docs: 'Pipecat integration',
    snippet: () => `from pipecat.services.cartesia import CartesiaTTSService

# Use Cartesia's voice inside a Pipecat pipeline.
tts = CartesiaTTSService(
  api_key=CARTESIA_API_KEY,
  voice_id="…",
)`,
  },
]

/* ── Web / Application embed section (Widget tab) ─────────────────────
   Empty until an avatar is attached. With a published avatar, shows the
   live preview + a multi-format embed picker (WebSocket / JS / Python /
   LiveKit / Pipecat — the formats Cartesia really supports). With an
   unpublished (draft) avatar, the preview still renders but the snippet
   is gated behind Publish. Card on the control surface; code block white. */
function WebEmbedSection({ avatar, published, onPickAvatar, onPublish, publishing }: {
  avatar: Avatar | null
  published: boolean
  onPickAvatar: () => void
  onPublish: () => void
  publishing: boolean
}) {
  const t = useContent()
  const [format, setFormat] = useState(EMBED_FORMATS[0])

  return (
    <div className="border border-neutral-400 rounded-[10px] overflow-hidden bg-bg-control">
      {/* Header — title only; the tab description already explains the surface. */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-300">
        <div className="w-9 h-9 rounded-[8px] bg-neutral-200 flex items-center justify-center shrink-0 text-neutral-700">
          <Globe size={18} strokeWidth={1.7} />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h4 className="text-[14.5px] font-[600] text-neutral-900 leading-5">{t('deploy.web-app.title')}</h4>
          {avatar && <Badge tone="neutral" size="sm">{t('deploy.avatar-badge')}</Badge>}
        </div>
      </div>

      {avatar ? (
        /* Body — live preview + embed snippet (gated until published) */
        <div className="px-5 py-5 flex flex-col md:flex-row gap-5">
          <div className="w-[150px] shrink-0">
            <AnamPreview
              greeting={undefined}
              manualStart
              posterUrl={avatar.imageUrl}
              avatarId={avatar.anamPersonaId}
              showCoverArt={false}
              showHud={false}
              className="!aspect-[3/4] rounded-[12px]"
            />
            <p className="mt-2 text-[11px] text-neutral-500 leading-4 text-center">
              {published ? t('deploy.preview.live') : t('deploy.preview.static')}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            {/* Format tabs — Cartesia's real client surfaces. */}
            <div className="flex items-center gap-0.5 mb-2.5 -ml-1">
              {EMBED_FORMATS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFormat(f)}
                  className={cn(
                    'h-[26px] px-2.5 rounded-[6px] text-[12.5px] font-[500] cursor-pointer transition-colors whitespace-nowrap',
                    format.key === f.key ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-500 hover:text-neutral-800',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Draft banner — the snippet only works once the avatar is live. */}
            {!published && (
              <div className="mb-2 flex items-center justify-between gap-3 px-3 py-2 rounded-[8px] border border-neutral-400 bg-neutral-200">
                <span className="flex items-center gap-2 min-w-0">
                  <AlertCircle size={15} strokeWidth={1.7} className="text-neutral-600 shrink-0" />
                  <span className="text-[12px] text-neutral-700 leading-4">
                    {t('deploy.publish-banner')}
                  </span>
                </span>
                <button
                  onClick={onPublish}
                  disabled={publishing}
                  className={cn(
                    'h-[26px] px-3 flex items-center gap-1.5 rounded-[6px] text-[12px] font-[500] shrink-0 transition-colors',
                    publishing ? 'bg-brand text-white cursor-wait' : 'bg-brand text-white hover:bg-brand-light cursor-pointer',
                  )}
                >
                  {publishing && <Spinner tone="inverse" size="xs" />}
                  {publishing ? t('agent.header.publishing') : t('agent.header.publish')}
                </button>
              </div>
            )}

            {/* Snippet — dimmed + non-interactive until published. */}
            <div className={cn(!published && 'opacity-50 pointer-events-none select-none')}>
              <CodeBlock code={format.snippet(AGENT.id)} lang={format.lang} />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-neutral-500 leading-4">
              {format.partner && <Badge tone="neutral" size="sm">{t('deploy.integration-badge')}</Badge>}
              {format.key === 'websocket'
                ? <>Connects with an access token minted server-side.</>
                : <>See the {format.docs} for the full flow.</>}
            </p>
          </div>
        </div>
      ) : (
        /* Empty — no avatar attached yet */
        <div className="px-5 py-10 flex flex-col items-center text-center gap-3">
          <div className="flex flex-col gap-1 max-w-[300px]">
            <p className="text-[13.5px] font-[500] text-neutral-900 leading-5">{t('preview.widget.no-avatar-title')}</p>
            <p className="text-[12.5px] text-neutral-500 leading-[1.5]">
              {t('deploy.no-avatar-hint')}
            </p>
          </div>
          <button
            onClick={onPickAvatar}
            className="mt-1 h-[30px] px-3.5 rounded-[7.2px] bg-brand text-white text-[13px] font-[500] hover:bg-brand-light cursor-pointer transition-colors"
          >
            {t('preview.widget.select-avatar')}
          </button>
        </div>
      )}
    </div>
  )
}

/* One simulated test-caller run — transcript expands, breaks highlighted. */
function SimRunCard({ run, open, onToggle, onReplay }: {
  run: { persona: SimPersona; status: 'running' | 'done' | 'error'; result?: SimResult; error?: string }
  open: boolean
  onToggle: () => void
  onReplay: (path: string[]) => void
}) {
  const t = useContent()
  const { persona, status, result } = run
  const breaksByTurn = new Map<number, string[]>()
  result?.breaks.forEach(b => {
    breaksByTurn.set(b.atTurn, [...(breaksByTurn.get(b.atTurn) ?? []), b.note])
  })

  return (
    <div className="border border-neutral-400 rounded-[10px] bg-bg-control overflow-hidden">
      <button
        onClick={onToggle}
        disabled={status !== 'done'}
        className={cn('w-full flex items-center gap-2.5 px-4 py-3 text-left', status === 'done' && 'cursor-pointer hover:bg-bg-control-hover transition-colors')}
      >
        <ChevronRight size={14} strokeWidth={1.5} className={cn('text-neutral-500 shrink-0 transition-transform', open && 'rotate-90', status !== 'done' && 'opacity-30')} />
        <Badge tone={persona.faith === 'good' ? 'brand' : 'neutral'} size="sm">
          {persona.faith === 'good' ? t('sim.faith.good') : t('sim.faith.bad')}
        </Badge>
        <span className="text-[13px] font-[600] text-neutral-900 leading-5 shrink-0">{t(`sim.persona.${persona.id}`)}</span>
        <span className="flex-1 min-w-0 text-[12px] text-neutral-500 leading-4 truncate">
          {status === 'done' ? result?.summary : status === 'error' ? run.error : persona.brief}
        </span>
        {status === 'running' && <Spinner size="xs" />}
        {status === 'error' && <Badge tone="neutral" size="sm" className="text-danger">{t('sim.outcome.failed')}</Badge>}
        {status === 'done' && (
          result!.breaks.length === 0
            ? <Badge size="sm">{t('sim.outcome.handled')}</Badge>
            : <Badge tone="neutral" size="sm" className="text-danger border-danger/30">{t(result!.breaks.length === 1 ? 'sim.outcome.breaks.one' : 'sim.outcome.breaks.other', { n: result!.breaks.length })}</Badge>
        )}
      </button>

      {open && result && (
        <div className="border-t border-neutral-300 px-4 py-3 flex flex-col gap-2 bg-white">
          {result.transcript.map((turn, i) => {
            const turnBreaks = breaksByTurn.get(i) ?? []
            return (
              <div key={i} className={cn('flex flex-col gap-1 rounded-[6px]', turnBreaks.length > 0 && 'bg-danger/5 border-l-2 border-danger/40 pl-2 py-1')}>
                <p className="text-[12px] leading-[1.5] text-neutral-800">
                  <span className={cn('font-[600] mr-1.5', turn.speaker === 'agent' ? 'text-brand' : 'text-neutral-500')}>
                    {turn.speaker === 'agent' ? t('sim.speaker.agent') : t('sim.speaker.caller')}
                  </span>
                  {turn.text}
                </p>
                {turnBreaks.map((note, j) => (
                  <p key={j} className="text-[11.5px] text-danger leading-4 flex items-start gap-1.5">
                    <AlertCircle size={12} strokeWidth={1.7} className="shrink-0 mt-0.5" />
                    {note}
                  </p>
                ))}
              </div>
            )
          })}
          {result.path.length > 0 && (
            <div className="pt-1">
              <button
                onClick={() => onReplay(result.path)}
                className="h-[26px] px-2.5 rounded-[6px] border border-border-default bg-bg-control text-[12px] font-[500] text-neutral-700 hover:bg-bg-control-hover cursor-pointer transition-colors"
              >
                {t('sim.replay')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AgentDetailPage({ onBack, selectedAvatar, onSelectAvatar, builderMode = false, onNameChange, onCountsChange }: {
  onBack?: () => void
  selectedAvatar?: Avatar | null
  onSelectAvatar?: (avatar: Avatar | null) => void
  /** New-agent flow: empty config + a Build tab in the preview panel whose
      conversation writes this page's form live. */
  builderMode?: boolean
  /** Reports the live agent name up to the agent-scoped sidebar. */
  onNameChange?: (name: string) => void
  /** Reports per-section counts (knowledge docs, flow steps) to the sidebar. */
  onCountsChange?: (counts: Record<string, number>) => void
}) {
  const navigate = useNavigate()
  const t = useContent()
  const { id: routeAgentId, tab: tabSlug } = useParams<{ id?: string; tab?: string }>()
  const activeTab: Tab = (tabSlug && SLUG_TO_TAB[tabSlug]) || 'Configuration'
  const basePath = builderMode ? '/agents/new/voice' : `/agents/${routeAgentId ?? 'demo'}`
  const goTab = useCallback((tab: Tab) => {
    navigate(`${basePath}/${TAB_TO_SLUG[tab]}`)
  }, [navigate, basePath])

  /* Chat-style entry: a first message typed on the Voice Agents page rides
     in via route state and kicks the builder off. */

  /* Agents built earlier reopen with their stored config — read once per
     mount (the route is keyed by :id, so each agent remounts cleanly). */
  const [stored] = useState(() => (!builderMode && routeAgentId ? getAgent(routeAgentId) : undefined))

  const [agentName, setAgentName] = useState(stored?.name ?? (builderMode ? 'untitled-agent' : AGENT.name))
  const [agentVoice, setAgentVoice] = useState<Voice>(
    () => VOICES.find(v => v.id === stored?.voiceId) ?? VOICES[0])
  const [kbDocs, setKbDocs] = useState<KnowledgeDoc[]>(stored?.knowledge ?? [])
  const [flow, setFlow] = useState<AgentFlow | null>(stored ? stored.flow : (builderMode ? null : DEMO_FLOW))
  /* Docked open on desktop; on mobile the panel is a fullscreen overlay, so it
     starts closed — except in builder mode, where the conversation IS the entry. */
  const [previewOpen, setPreviewOpen] = useState(() =>
    builderMode || window.matchMedia('(min-width: 768px)').matches)

  /* ── Run-time flow tracing ──────────────────────────────────────
     Each agent turn in a Phone preview call is classified onto the
     flow graph (active node + visited trail); deviations from the
     design land in the Eval list, where the builder can fix them. */
  const [trace, setTrace] = useState<{ active: string | null; visited: string[] }>({ active: null, visited: [] })
  const [deviations, setDeviations] = useState<{ id: number; note: string }[]>([])
  const [fixRequest, setFixRequest] = useState<string | null>(null)
  const flowForTraceRef = useRef<AgentFlow | null>(flow)
  const traceBusyRef = useRef(false)
  const tracedCountRef = useRef(0)
  const deviationIdRef = useRef(0)
  useEffect(() => { flowForTraceRef.current = flow }, [flow])

  /* ── Simulation — text test-callers before anyone dials ─────────── */
  type SimRun = { persona: SimPersona; status: 'running' | 'done' | 'error'; result?: SimResult; error?: string }
  const [simRuns, setSimRuns] = useState<SimRun[]>([])
  const [openSimId, setOpenSimId] = useState<string | null>(null)
  const simReplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const simRunning = simRuns.some(r => r.status === 'running')

  /* What the console knows about verification — the builder's playbook
     stage derives from this, so the brain coaches from facts, not guesses. */
  const verifySignals: VerifySignals = {
    simRun: simRuns.length > 0 && simRuns.every(r => r.status !== 'running'),
    simRunning: simRuns.some(r => r.status === 'running'),
    breaks: simRuns.reduce((a, r) => a + (r.result?.breaks.length ?? 0), 0),
    deviations: deviations.length,
    notes: deviations.map(d => d.note),
  }

  /* Run test callers from the Build conversation: jump to Observability so
     the run is visible, then fire it. */
  function runSimulationsFromBuilder() {
    if (activeTab !== 'Flow') goTab('Flow')
    runSimulations()
  }

  function runSimulations() {
    if (simRunning || !agentSystemPrompt) return
    setSimRuns(SIM_PERSONAS.map(p => ({ persona: p, status: 'running' as const })))
    setOpenSimId(null)
    const config = {
      name: agentName,
      systemPrompt: agentSystemPrompt,
      initialMessage: agentInitialMessage,
      knowledge: kbDocs,
      flow,
    }
    SIM_PERSONAS.forEach(persona => {
      void simulateCall(config, persona)
        .then(result => {
          setSimRuns(prev => prev.map(r => r.persona.id === persona.id ? { ...r, status: 'done' as const, result } : r))
          if (result.breaks.length > 0) {
            const adds = result.breaks.map(b => ({
              id: ++deviationIdRef.current,
              note: `[${persona.name} · simulated] ${b.note}`,
            }))
            setDeviations(prev => {
              const fresh = adds.filter(a => !prev.some(d => d.note === a.note))
              return fresh.length > 0 ? [...prev, ...fresh] : prev
            })
          }
        })
        .catch((err: unknown) => {
          console.error('Simulation run failed:', err)
          setSimRuns(prev => prev.map(r => r.persona.id === persona.id
            ? { ...r, status: 'error' as const, error: err instanceof Error ? err.message : 'Simulation failed' }
            : r))
        })
    })
  }

  /* Step the canvas trace along a simulated call's path. */
  function replayPath(path: string[]) {
    if (path.length === 0) return
    if (simReplayRef.current) clearInterval(simReplayRef.current)
    let step = 0
    setTrace({ active: path[0], visited: [] })
    const intervalId = setInterval(() => {
      step += 1
      if (step >= path.length) {
        clearInterval(intervalId)
        return
      }
      setTrace({ active: path[step], visited: path.slice(0, step) })
    }, 700)
    simReplayRef.current = intervalId
  }
  useEffect(() => () => { if (simReplayRef.current) clearInterval(simReplayRef.current) }, [])

  const handlePhoneTranscript = useCallback((msgs: TraceTurn[]) => {
    if (msgs.length === 0) {
      tracedCountRef.current = 0
      // Bail out when already empty — this runs on every parent render via
      // the PhonePreview effect, and an always-new object would loop.
      setTrace(prev => (prev.active === null && prev.visited.length === 0) ? prev : { active: null, visited: [] })
      return
    }
    const currentFlow = flowForTraceRef.current
    const last = msgs[msgs.length - 1]
    if (!currentFlow || last.role !== 'agent') return
    if (msgs.length <= tracedCountRef.current || traceBusyRef.current) return
    traceBusyRef.current = true
    tracedCountRef.current = msgs.length
    void traceCall(currentFlow, msgs.slice(-6)).then(result => {
      traceBusyRef.current = false
      if (result.nodeId) {
        setTrace(prev => ({
          active: result.nodeId,
          visited: prev.active && prev.active !== result.nodeId && !prev.visited.includes(prev.active)
            ? [...prev.visited, prev.active]
            : prev.visited,
        }))
      }
      if (result.deviation) {
        const add = { id: ++deviationIdRef.current, note: result.deviation }
        setDeviations(prev => prev.some(d => d.note === add.note) ? prev : [...prev, add])
      }
    })
  }, [])

  /* Keep the agent-scoped sidebar in sync (name + live section counts). */
  useEffect(() => {
    if (builderMode) onNameChange?.(agentName)
  }, [builderMode, agentName, onNameChange])
  useEffect(() => {
    onCountsChange?.({ 'knowledge-base': kbDocs.length, flow: flow?.nodes.length ?? 0 })
  }, [kbDocs.length, flow, onCountsChange])
  useEffect(() => () => { onCountsChange?.({}) }, [onCountsChange])
  const [agentSystemPrompt, setAgentSystemPrompt] = useState(stored?.systemPrompt ?? (builderMode ? '' : DEFAULT_SYSTEM_PROMPT))
  const [agentInitialMessage, setAgentInitialMessage] = useState(stored?.initialMessage ?? (builderMode ? '' : DEFAULT_INITIAL_MESSAGE))

  /* Persist built agents (and edits to them) so they appear in the sidebar
     and the agents list like conversations in a chat app. The demo agent
     (open-dialogue) is never persisted. */
  const prevPersistIdRef = useRef<string | null>(null)
  useEffect(() => {
    const eligible = builderMode ? agentName !== 'untitled-agent' : !!stored
    if (!eligible) return
    if (prevPersistIdRef.current && prevPersistIdRef.current !== agentName) {
      removeAgent(prevPersistIdRef.current)
    }
    prevPersistIdRef.current = agentName
    upsertAgent({
      id: agentName,
      name: agentName,
      systemPrompt: agentSystemPrompt,
      initialMessage: agentInitialMessage,
      voiceId: agentVoice.id,
      knowledge: kbDocs,
      flow,
    })
  }, [builderMode, stored, agentName, agentSystemPrompt, agentInitialMessage, agentVoice, kbDocs, flow])

  /* The page's live config as a builder draft — editing an existing agent
     starts the Build session from here instead of a blank slate. */
  const liveDraft: AgentDraft = {
    name: agentName,
    useCase: null,
    language: agentVoice.language ?? null,
    voiceId: agentVoice.id,
    systemPrompt: agentSystemPrompt || null,
    initialMessage: agentInitialMessage || null,
    knowledge: kbDocs,
    flow,
  }


  /* ── Test call — ONE engine, two entry points: the bottom bar and the
     Build panel's in-conversation affordances. ── */
  const {
    callState: testCallState, talkState: testTalkState, agentAmplitude: testAgentAmplitude,
    messages: testMessages, error: testCallError, startCall: startTestCall,
    endCall: endTestCall, toggleMute: toggleTestMute, muted: testMuted,
  } = useVoiceAgent({ systemPrompt: agentSystemPrompt, initialMessage: agentInitialMessage, voiceId: agentVoice.cartesiaId })
  // eslint-disable-next-line react-hooks/set-state-in-effect -- trace reset bails on identical prev; tracer itself is async
  useEffect(() => { handlePhoneTranscript(testMessages) }, [testMessages, handlePhoneTranscript])

  /* Each brain turn lands here: the conversation writes the real form.
     The compiler skips this component, so the manual memo IS the memoization;
     stable identities here prevent the PhonePreview-effect render loop. */
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleBuilderPatch = useCallback((patch: DraftPatch) => {
    if (patch.name) setAgentName(patch.name)
    if (patch.systemPrompt) setAgentSystemPrompt(patch.systemPrompt)
    if (patch.initialMessage) setAgentInitialMessage(patch.initialMessage)
    if (patch.voiceId) {
      const picked = VOICES.find(v => v.id === patch.voiceId)
      if (picked) setAgentVoice(picked)
    }
    if (patch.knowledge) {
      const docs = patch.knowledge
      setKbDocs(prev => upsertDocs(prev, docs))
    }
    if (patch.flow) setFlow(patch.flow)
  }, [])
  const hasFace = !!selectedAvatar

  /* Which avatar is live in production. Starts null (no avatar published yet).
     hasDraft = avatar is selected but differs from what's live — gates Publish.
     avatarPublished = selected avatar matches what's live — shows snippet. */
  const [publishedAvatarId, setPublishedAvatarId] = useState<string | null>(null)
  const avatarPublished = !!selectedAvatar && publishedAvatarId === selectedAvatar.id
  const hasDraft = !!selectedAvatar && !avatarPublished

  // Demo reset: when selectedAvatar is cleared, unpublish so the flow restarts cleanly.
  useEffect(() => {
    if (!selectedAvatar) setPublishedAvatarId(null)
  }, [selectedAvatar])

  /* Publish promotes the config to production. After the build "completes"
     we drop the user on the Widget tab when a face is attached — that's the
     surface they need to grab the embed snippet for. */
  const [publishing, setPublishing] = useState(false)
  function handlePublish() {
    if (!hasDraft || publishing) return
    setPublishing(true)
    setTimeout(() => {
      setPublishing(false)
      setPublishedAvatarId(selectedAvatar?.id ?? null)
      if (hasFace) goTab('Widget')
    }, 1400)
  }

  return (
    <div className="flex flex-col h-full bg-neutral-100">

      {/* Header bar */}
      <div className="shrink-0 h-[44px] flex items-center bg-neutral-100 px-4 md:px-9 border-b border-neutral-400">
        {/* Left: breadcrumb + id chip + branch */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <nav className="flex items-center gap-1.5 text-[13.5px] min-w-0">
            <a onClick={onBack} className="hidden sm:block text-neutral-600 hover:text-neutral-900 cursor-pointer leading-5 whitespace-nowrap">All Agents</a>
            <ChevronRight size={14} strokeWidth={1.17} className="hidden sm:block text-neutral-600 shrink-0" />
            <span className="font-[600] text-neutral-900 leading-5 truncate">{agentName}</span>
          </nav>
          <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-[7.2px] bg-neutral-300 text-[12.5px] text-neutral-600 leading-5 whitespace-nowrap">
            {AGENT.id}
          </span>
          <a className="hidden md:flex items-center gap-1 text-neutral-500 cursor-pointer">
            <GitBranch size={14} strokeWidth={1.33} className="shrink-0" />
            <span className="text-[13px] leading-5">{AGENT.branch}</span>
          </a>
        </div>

        {/* Right: [Preview] [Publish] · # number [Call▾] */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Preview — test surface, opens right panel */}
          <button
            onClick={() => setPreviewOpen(v => !v)}
            className={cn(
              'h-[30px] px-3 rounded-[7.2px] border text-[13px] font-[500] transition-colors cursor-pointer',
              previewOpen
                ? 'border-neutral-500 bg-neutral-200 text-neutral-900'
                : 'border-neutral-400 bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
            )}
          >
            {t('preview.tab.build')}
          </button>

          {/* Publish — promotes the current config to production, then lands on
              the Widget tab (where the embed snippet lives) when faced. */}
          <button
            onClick={handlePublish}
            disabled={!hasDraft || publishing}
            className={cn(
              'h-[30px] px-3 flex items-center gap-1.5 rounded-[7.2px] text-[13px] font-[500] transition-colors',
              hasDraft && !publishing
                ? 'bg-brand text-white hover:bg-brand-light cursor-pointer'
                : publishing
                  ? 'bg-brand text-white cursor-wait'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed',
            )}
          >
            {publishing && <Spinner tone="inverse" />}
            {publishing ? t('agent.header.publishing') : t('agent.header.publish')}
          </button>

        </div>
      </div>

      {/* Below the header: content (scrolls) | preview panel (docks right).
          Sections are navigated from the agent-scoped sidebar — no tab bar. */}
      <div className="flex flex-1 min-h-0">

        {/* Content — own scroll area, centered max-width column (Figma 56:1780) */}
        <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="px-4 md:px-9 pt-6 max-w-[1200px] w-full mx-auto flex flex-col pb-12">
            {activeTab === 'Configuration' ? (
              <AgentConfigurationTab
                selectedAvatar={selectedAvatar ?? null}
                onSelectAvatar={onSelectAvatar ?? (() => {})}
                systemPrompt={agentSystemPrompt}
                onSystemPromptChange={setAgentSystemPrompt}
                initialMessage={agentInitialMessage}
                onInitialMessageChange={setAgentInitialMessage}
                voice={agentVoice}
                onVoiceChange={setAgentVoice}
              />
            ) : activeTab === 'Deployment' ? (
              <>
                {/* Production Version — read-only status of what's live. The
                    "Live on" field shows which channels the version is serving;
                    publishing to production happens from the header Publish button. */}
                <div className="py-4">
                  <h3 className="text-[18.6px] font-[600] text-neutral-900 leading-7">{t('deploy.production.title')}</h3>
                </div>
                <div className="rounded-[4.32px] px-2 md:px-6 py-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
                    <Field label={t('deploy.field.version')}>
                      <span className="font-mono text-[14px] text-neutral-900">{PRODUCTION.version}</span>
                    </Field>
                    <Field label={t('deploy.field.status')}>
                      <span className="flex items-center gap-2">
                        <StatusDot />
                        <span className="text-[13.9px] text-neutral-900">{PRODUCTION.status}</span>
                      </span>
                    </Field>
                    <Field label={t('deploy.field.deployed')}>
                      <span className="text-[13.1px] text-neutral-900">{PRODUCTION.deployed}</span>
                    </Field>
                    <Field
                      label={
                        <span className="flex items-center gap-1">
                          {t('deploy.field.webhook')}
                          <ExternalLink size={12} strokeWidth={0} fill="currentColor" className="text-neutral-500" />
                        </span>
                      }
                    >
                      <button className="flex items-center gap-1 cursor-pointer">
                        <span className="text-[13.5px] text-neutral-500 underline">{PRODUCTION.webhook}</span>
                        <ExternalLink size={10} strokeWidth={0} fill="currentColor" className="text-neutral-500" />
                      </button>
                    </Field>
                  </div>
                  {/* Live on — read-only channel status for this version */}
                  <div className="mt-8">
                    <Field label={t('deploy.field.live-on')}>
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <ChannelChip icon={<Phone size={11} strokeWidth={0} fill="currentColor" />} label={`Phone · ${AGENT.phoneNumber}`} />
                        {avatarPublished && (
                          <ChannelChip icon={<Globe size={11} strokeWidth={1.8} />} label="Web embed" />
                        )}
                      </span>
                    </Field>
                  </div>
                </div>

                {/* Version History */}
                <div className="pt-4 flex items-center justify-between">
                  <h3 className="text-[18.6px] font-[600] text-neutral-900 leading-7">{t('deploy.history.title')}</h3>
                  <button className="h-[26px] px-2.5 rounded-[5.76px] border border-neutral-400 bg-neutral-100 text-[12.6px] font-[500] text-neutral-900 hover:bg-neutral-200 cursor-pointer">
                    {t('deploy.history.cta')}
                  </button>
                </div>
                <div className="mt-4 border border-neutral-400 rounded-[7.2px] overflow-hidden pt-4">
                  {VERSIONS.map((v, i) => (
                    <VersionRow key={v.id} version={v} last={i === VERSIONS.length - 1} />
                  ))}
                </div>
              </>
            ) : activeTab === 'Flow' ? (
              <>
                {/* Flow — an observability view of the Line agent, not a node
                    runtime. Every node is a real Line primitive (introduction,
                    system prompt task, loopback tool / knowledge_base,
                    agent_as_handoff, transfer_call, end_call); branches live
                    on conditioned edges, which is what Line tool/handoff
                    descriptions actually are. */}
                <div className="py-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-[18.6px] font-[600] text-neutral-900 leading-7">{t('flow.title')}</h3>
                    <p className="text-[13px] text-neutral-500 leading-5 mt-0.5">
                      {t('flow.sub', { name: agentName })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 pb-1">
                    {trace.active && (
                      <Badge>
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-light" style={{ animation: 'speakPulse 1s ease-in-out infinite' }} />
                        {t('flow.tracing-badge')}
                      </Badge>
                    )}
                    {flow && (
                      <p className="text-[11.5px] text-neutral-500 leading-4 whitespace-nowrap text-right">
                        {t('flow.stats', { steps: flow.nodes.length, paths: flow.edges.length })}
                        <span className="hidden md:block text-[10.5px] text-neutral-400 mt-0.5">{t('flow.compiled-note')}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Jump anchors — the tab holds three sections */}
                <div className="flex items-center gap-1.5 mb-3">
                  {([['obs-flow', t('flow.section.flow')], ['obs-sim', t('sim.title')], ['obs-eval', t('eval.title')]] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="h-6 px-2.5 rounded-full border border-border-default bg-bg-control text-[11.5px] font-[500] text-neutral-600 hover:bg-bg-control-hover cursor-pointer transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {flow ? (
                  <div id="obs-flow" className="h-[440px] md:h-[620px] border border-neutral-400 rounded-[14px] overflow-hidden bg-neutral-100">
                    <FlowCanvas flow={flow} activeNodeId={trace.active} visitedIds={trace.visited} />
                  </div>
                ) : (
                  <div className="h-[420px] border border-neutral-400 rounded-[14px] bg-neutral-100 flex items-center justify-center">
                    <p className="text-[13px] text-neutral-500 max-w-[320px] text-center leading-5">
                      {t('flow.empty')}
                    </p>
                  </div>
                )}

                {/* Simulation — good-faith and bad-faith callers run against
                    the agent in text, before anyone dials it. Breaks land in
                    the same Eval list as live-call deviations. */}
                <div id="obs-sim" className="mt-5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14.5px] font-[600] text-neutral-900 leading-5">{t('sim.title')}</h4>
                      <span className="relative group flex items-center">
                        <Info size={13} strokeWidth={1.7} className="text-neutral-500 hover:text-neutral-700 cursor-help" aria-label={t('sim.tooltip')} />
                        <span className="hidden group-hover:block absolute left-0 bottom-full mb-1.5 w-[300px] p-3 rounded-[8px] border border-neutral-400 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[11.5px] font-[400] text-neutral-700 leading-[1.55] z-30 text-left">
                          {t('sim.tooltip')}
                        </span>
                      </span>
                      <Badge tone="neutral" size="sm">{t('sim.badge', { n: SIM_PERSONAS.length })}</Badge>
                    </div>
                    <button
                      onClick={runSimulations}
                      disabled={simRunning || !agentSystemPrompt}
                      className={cn(
                        'h-[28px] px-3 flex items-center gap-1.5 rounded-[7px] text-[12.5px] font-[500] transition-colors',
                        simRunning || !agentSystemPrompt
                          ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                          : 'bg-brand text-white hover:bg-brand-light cursor-pointer',
                      )}
                    >
                      {simRunning && <Spinner tone="inverse" size="xs" />}
                      {simRunning ? t('sim.running') : t('sim.run')}
                    </button>
                  </div>
                  {simRuns.length === 0 ? (
                    <p className="text-[12px] text-neutral-500 leading-[1.5]">
                      {t('sim.intro')}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {simRuns.map(run => (
                        <SimRunCard
                          key={run.persona.id}
                          run={run}
                          open={openSimId === run.persona.id}
                          onToggle={() => setOpenSimId(prev => prev === run.persona.id ? null : run.persona.id)}
                          onReplay={replayPath}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Eval — deviations the tracer caught during preview calls.
                    Each one can be handed straight back to the builder. */}
                {deviations.length > 0 && (
                  <div id="obs-eval" className="mt-5 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14.5px] font-[600] text-neutral-900 leading-5">{t('eval.title')}</h4>
                      <Badge tone="neutral" size="sm">
                        {t(deviations.length === 1 ? 'eval.badge.one' : 'eval.badge.other', { n: deviations.length })}
                      </Badge>
                    </div>
                    {deviations.map(d => (
                      <div key={d.id} className="border border-neutral-400 rounded-[10px] bg-bg-control px-4 py-3 flex items-start gap-3">
                        <AlertCircle size={15} strokeWidth={1.7} className="text-neutral-600 shrink-0 mt-0.5" />
                        <p className="flex-1 min-w-0 text-[12.5px] text-neutral-800 leading-[1.5]">{d.note}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(
                            <button
                              onClick={() => setFixRequest(
                                `During a phone test of this agent, an evaluator flagged: "${d.note}". Adjust the system prompt (and the flow if needed) so the agent handles this correctly, and briefly tell me what you changed.`,
                              )}
                              className="h-[26px] px-2.5 rounded-[6px] bg-brand text-white text-[12px] font-[500] hover:bg-brand-light cursor-pointer transition-colors"
                            >
                              {t('eval.fix')}
                            </button>
                          )}
                          <button
                            onClick={() => setDeviations(prev => prev.filter(x => x.id !== d.id))}
                            className="w-[26px] h-[26px] flex items-center justify-center rounded-[6px] hover:bg-neutral-200 text-neutral-500 cursor-pointer transition-colors"
                          >
                            <X size={13} strokeWidth={1.7} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : activeTab === 'Knowledge Base' ? (
              <>
                {/* Knowledge Base — facts the agent queries at call time via its
                    knowledge_base tool. Seeded by the voice builder's extraction. */}
                <div className="py-4">
                  <h3 className="text-[18.6px] font-[600] text-neutral-900 leading-7">{t('kb.title')}</h3>
                  <p className="text-[13px] text-neutral-500 leading-5 mt-0.5">
                    {t('kb.sub')}
                  </p>
                </div>
                {kbDocs.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {kbDocs.map(doc => (
                      <div key={doc.title} className="border border-neutral-400 rounded-[10px] bg-bg-control px-5 py-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <FileText size={15} strokeWidth={1.7} className="text-neutral-600 shrink-0" />
                          <h4 className="text-[13.6px] font-[600] text-neutral-900 leading-5 flex-1 min-w-0 truncate">{doc.title}</h4>
                          <Badge tone="neutral" size="sm">{t('kb.from-conversation')}</Badge>
                        </div>
                        <pre className="text-[12.5px] text-neutral-700 whitespace-pre-wrap font-sans leading-[1.55]">{doc.content}</pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 flex items-center justify-center">
                    <p className="text-[13px] text-neutral-500">{t('kb.empty')}</p>
                  </div>
                )}
              </>
            ) : activeTab === 'Widget' ? (
              <>
                {/* Widget — the agent's embeddable web surface (ElevenLabs/Anam
                    pattern). Snippet + live preview live on their own tab, not
                    buried in Deployment. */}
                <div className="py-4">
                  <h3 className="text-[18.6px] font-[600] text-neutral-900 leading-7">{t('deploy.widget.title')}</h3>
                  <p className="text-[13px] text-neutral-500 leading-5 mt-0.5">
                    {t('deploy.widget.sub')}
                  </p>
                </div>
                <WebEmbedSection
                  avatar={selectedAvatar ?? null}
                  published={avatarPublished}
                  onPickAvatar={() => goTab('Configuration')}
                  onPublish={handlePublish}
                  publishing={publishing}
                />
              </>
            ) : (
              <div className="py-16 flex items-center justify-center">
                <p className="text-[13px] text-neutral-500">{t('agent.tab.coming-soon', { tab: t(`shell.nav.section.${TAB_TO_SLUG[activeTab]}`) })}</p>
              </div>
            )}
          </div>
          </div>

          {/* Test anywhere — the bar persists under every tab, scoped to the
              content column so it never invades the Build dock */}
          <BottomTestBar
            agentName={agentName}
            callState={testCallState}
            talkState={testTalkState}
            agentAmplitude={testAgentAmplitude}
            error={testCallError}
            muted={testMuted}
            phoneNumber={!builderMode && !stored ? AGENT.phoneNumber : null}
            onStart={() => void startTestCall()}
            onEnd={endTestCall}
            onToggleMute={toggleTestMute}
          />
        </div>

        {/* ── Build dock — desktop/tablet: docks right with a width
              transition; phones: fullscreen overlay below the top bar ── */}
        <div className={cn(
          'flex flex-col overflow-hidden md:shrink-0 md:h-full md:transition-[width] md:duration-300 md:ease-in-out',
          previewOpen
            ? 'fixed inset-x-0 top-12 bottom-0 z-40 md:static md:inset-auto md:w-[400px]'
            : 'hidden md:flex md:w-0',
        )}>
          <BuildDock
            onClose={() => setPreviewOpen(false)}
            testCallActive={testCallState === 'active' || testCallState === 'connecting'}
            onStartTestCall={() => void startTestCall()}
            onRunSim={runSimulationsFromBuilder}
            verifySignals={verifySignals}
            onBuilderPatch={handleBuilderPatch}
            fixRequest={fixRequest}
            onFixConsumed={() => setFixRequest(null)}
            currentDraft={builderMode ? null : liveDraft}
            builderGreeting={builderMode ? undefined : t('builder.greeting.edit', { name: agentName })}
          />
        </div>
      </div>
    </div>
  )
}
