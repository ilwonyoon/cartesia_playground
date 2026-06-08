import { useState, useRef, useEffect } from 'react'
import {
  ChevronRight, ChevronDown, Phone, GitBranch,
  ExternalLink, MoreVertical, X, Globe, Hash, AlertCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { AgentConfigurationTab } from './AgentConfigurationTab'
import { useVoiceAgent } from '../hooks/useVoiceAgent'
import { AnamPreview } from '../components/avatar/AnamPreview'
import { CodeBlock, type CodeLang } from '../components/ui/CodeBlock'
import type { Avatar } from '../data/avatars'

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

const TABS = [
  'Configuration', 'Deployment', 'Widget', 'Environment',
  'Knowledge Base', 'Metrics', 'Calls', 'Settings',
] as const
type Tab = (typeof TABS)[number]

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
            <span className="inline-flex items-center h-5 px-[9px] rounded-full border border-brand/20 bg-brand-tint text-[11.8px] font-[500] text-brand leading-4">
              Production
            </span>
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

type PreviewMode = 'Widget' | 'Phone'

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

/* Web preview — the embeddable widget as a visitor meets it: a floating card
   that, on click, opens into a live face conversation (mic on). Mirrors the
   FloatingAvatarWidget → OnboardingModal flow, scaled into the panel. */
function WebPreview() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <div className="flex-1 bg-neutral-100 relative overflow-hidden">
        {/* Faux site backdrop so the floating widget reads as an embed */}
        <div className="absolute inset-0 p-5 flex flex-col gap-2.5 opacity-50 select-none pointer-events-none">
          <div className="h-3 w-1/2 rounded bg-neutral-300" />
          <div className="h-2.5 w-3/4 rounded bg-neutral-300" />
          <div className="h-2.5 w-2/3 rounded bg-neutral-300" />
          <div className="mt-3 h-24 w-full rounded-[10px] bg-neutral-200" />
          <div className="h-2.5 w-1/2 rounded bg-neutral-300" />
        </div>

        {/* Floating widget — bottom-right, same shape as the live one */}
        <div className="absolute bottom-4 right-4" style={{ width: 132 }}>
          <button
            onClick={() => setOpen(true)}
            className="block w-full rounded-[18px] overflow-hidden cursor-pointer shadow-[0px_4px_8px_rgba(0,0,0,0.08),0px_14px_14px_rgba(0,0,0,0.07)] transition-transform hover:scale-[1.02]"
          >
            <AnamPreview
              greeting={undefined}
              manualStart
              posterUrl="/avatars/sophie_sofa.png"
              showCoverArt={false}
              className="!aspect-[3/4] rounded-none"
            />
          </button>
          <p className="mt-2 text-[11px] text-neutral-500 leading-4 text-center">Click to talk</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-neutral-900 flex flex-col">
      <AnamPreview
        greeting="Hey! I'm your agent — now with a face. Ask me anything."
        micEnabled
        showCoverArt={false}
        className="flex-1 !aspect-auto"
      />
      <button
        onClick={() => setOpen(false)}
        className="shrink-0 h-11 flex items-center justify-center gap-2 bg-neutral-900 text-white/70 text-[12.5px] font-[500] hover:text-white border-t border-white/10 cursor-pointer transition-colors"
      >
        <X size={14} strokeWidth={1.6} /> End preview
      </button>
    </div>
  )
}

function PhonePreview() {
  const { callState, talkState, agentAmplitude, userAmplitude, error, startCall, endCall, toggleMute, muted } = useVoiceAgent()
  const duration = useDuration(callState === 'active')

  const isActive = callState === 'active'
  const isConnecting = callState === 'connecting'

  return (
    <>
      {isActive ? (
        <div className="flex-1 flex items-center justify-center bg-neutral-100 p-5">
          {/* Figma: Section - Voice call — compact card, centered in panel */}
          <div className="w-full rounded-[13px] border border-[rgba(223,220,215,0.8)] bg-[rgba(253,253,252,0.95)] backdrop-blur-[12px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-hidden">

            {/* Header row: mic icon + name/status + end call */}
            <div className="flex items-center gap-3 px-3 pt-2 pb-1.5">
              <button
                onClick={toggleMute}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-[0px_0px_0px_1px_rgba(10,10,10,0.08),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]',
                  muted ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700',
                )}
              >
                <MicIcon muted={muted} size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[13.7px] font-[600] text-[#39342f] tracking-[-0.375px] leading-5 truncate">{AGENT.name}</p>
                <p className="text-[11.3px] text-[#636260] leading-4">Live call</p>
              </div>
              <button
                onClick={endCall}
                className="w-10 h-10 rounded-full bg-[#fb2c36] flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity cursor-pointer shadow-[0px_0px_0px_1px_rgba(193,0,7,0.2),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
              >
                <Phone size={16} strokeWidth={0} fill="white" className="rotate-[135deg]" />
              </button>
            </div>

            {/* Agent waveform */}
            <div className="px-3 pt-1 pb-0.5 flex items-center gap-2">
              <span className="text-[10px] font-[600] text-[rgba(57,52,47,0.8)] tracking-[0.25px] w-7 shrink-0">Agent</span>
              <Waveform amplitude={agentAmplitude} active={talkState === 'speaking'} variant="agent" />
            </div>

            {/* You waveform */}
            <div className="px-3 pt-2 pb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-[600] text-[rgba(57,52,47,0.8)] tracking-[0.25px] w-7 shrink-0">You</span>
              <Waveform amplitude={userAmplitude} active={!muted} variant="user" />
            </div>

            {/* Status bar */}
            <div className="px-3 py-2 flex items-center justify-between border-t border-[rgba(223,220,215,0.6)]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#00d492', boxShadow: talkState === 'speaking' ? '0 0 8px rgba(52,211,153,0.6)' : 'none', opacity: talkState === 'speaking' ? 1 : 0.35 }} />
                  <span className="text-[11px] text-[#636260]">Agent speaking</span>
                </div>
                <span className="text-[11px] text-[rgba(99,98,96,0.7)]">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#00a6f4', boxShadow: !muted ? '0 0 6px rgba(14,165,233,0.5)' : 'none', opacity: muted ? 0.35 : 1 }} />
                  <span className="text-[11px] text-[#636260]">{muted ? 'Mic muted' : 'Mic connected'}</span>
                </div>
              </div>
              <span className="text-[11px] text-[#636260] tabular-nums">{duration}</span>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex-1 bg-neutral-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            {error && (
              <p className="text-[12px] text-danger leading-4 max-w-[220px]">{error}</p>
            )}
            <button
              onClick={startCall}
              disabled={isConnecting}
              className="w-14 h-14 rounded-full bg-brand hover:bg-brand-light transition-colors flex items-center justify-center shadow-[0px_4px_14px_rgba(0,77,34,0.35)] cursor-pointer disabled:opacity-50"
            >
              {isConnecting
                ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Phone size={22} strokeWidth={0} fill="white" />
              }
            </button>
            <div className="flex flex-col gap-1">
              <p className="text-[13px] font-[500] text-neutral-900 leading-5">
                {isConnecting ? 'Connecting…' : 'Test your agent'}
              </p>
              {!isConnecting && (
                <p className="text-[12px] text-neutral-500 leading-4 max-w-[200px]">
                  Start a call to preview {AGENT.name} over the phone.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* Preview panel — mirrors the deploy channels: a Web tab (floating widget →
   click → live face) and a Phone tab (PSTN call test). Web is the default
   when a face is attached, since that's where the face is meant to live. */
function PreviewPanel({ onClose, hasFace }: { onClose: () => void; hasFace: boolean }) {
  const [mode, setMode] = useState<PreviewMode>(hasFace ? 'Widget' : 'Phone')

  return (
    <aside className="w-[400px] shrink-0 flex flex-col h-full border-l border-neutral-400 bg-neutral-100">
      {/* Panel toolbar */}
      <div className="h-[48px] flex items-center justify-between gap-2 px-3 border-b border-neutral-400">
        <div className="flex items-center p-0.5 rounded-[7.2px] bg-neutral-300">
          {(['Phone', 'Widget'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'h-[26px] px-3 rounded-[5.76px] text-[12.5px] font-[500] leading-5 cursor-pointer transition-colors whitespace-nowrap',
                mode === m ? 'bg-neutral-100 text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-[5.76px] hover:bg-neutral-200 cursor-pointer">
          <X size={16} strokeWidth={1.5} className="text-neutral-600" />
        </button>
      </div>

      {mode === 'Widget' ? <WebPreview /> : <PhonePreview />}
    </aside>
  )
}

/* Phone slot — shows Get Phone Number OR Call▼ depending on provisioning. */
function CallButton({ hasNumber }: { hasNumber: boolean }) {
  const [open, setOpen] = useState(false)
  const [callTo, setCallTo] = useState('+1')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!hasNumber) {
    return (
      <button className="h-[30px] px-3 rounded-control border border-border-default bg-bg-control text-[13px] font-[500] text-neutral-900 hover:bg-bg-control-hover cursor-pointer whitespace-nowrap transition-colors">
        Get Phone Number
      </button>
    )
  }

  return (
    <div ref={ref} className="relative flex gap-px">
      <button className="h-[30px] pl-2.5 pr-3 flex items-center gap-1.5 rounded-l-[7.2px] text-[13px] font-[500] bg-brand text-white hover:bg-brand-light transition-colors cursor-pointer">
        <Phone size={14} strokeWidth={0} fill="currentColor" />
        Call
      </button>
      <button
        onClick={() => setOpen(v => !v)}
        className="h-[30px] w-[26px] flex items-center justify-center rounded-r-[7.2px] bg-brand text-white hover:bg-brand-light transition-colors cursor-pointer"
      >
        <ChevronDown size={13} strokeWidth={1.5} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-[250px] bg-white border border-neutral-400 rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-3 z-50">
          <p className="text-[12.5px] font-[600] text-neutral-900 mb-2">Send Call to Phone Number</p>
          <div className="flex items-center gap-2">
            <input
              value={callTo}
              onChange={e => setCallTo(e.target.value)}
              className="flex-1 h-8 px-3 rounded-[6px] border border-neutral-400 bg-white text-[13px] text-neutral-900 outline-none focus:border-neutral-600"
            />
            <button className="w-8 h-8 flex items-center justify-center rounded-[6px] bg-brand text-white hover:bg-brand-light transition-colors cursor-pointer shrink-0">
              <Phone size={14} strokeWidth={0} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </div>
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
  const [format, setFormat] = useState(EMBED_FORMATS[0])

  return (
    <div className="border border-neutral-400 rounded-[10px] overflow-hidden bg-bg-control">
      {/* Header — title only; the tab description already explains the surface. */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-300">
        <div className="w-9 h-9 rounded-[8px] bg-neutral-200 flex items-center justify-center shrink-0 text-neutral-700">
          <Globe size={18} strokeWidth={1.7} />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h4 className="text-[14.5px] font-[600] text-neutral-900 leading-5">Web / Application</h4>
          {avatar && (
            <span className="inline-flex items-center h-[18px] px-[8px] rounded-full border border-neutral-400 bg-neutral-200 text-[10.5px] font-[500] text-neutral-600 leading-4">Avatar</span>
          )}
        </div>
      </div>

      {avatar ? (
        /* Body — live preview + embed snippet (gated until published) */
        <div className="px-5 py-5 flex gap-5">
          <div className="w-[150px] shrink-0">
            <AnamPreview
              greeting={undefined}
              manualStart
              posterUrl={avatar.imageUrl}
              avatarId={avatar.anamPersonaId}
              showCoverArt={false}
              className="!aspect-[3/4] rounded-[12px]"
            />
            <p className="mt-2 text-[11px] text-neutral-500 leading-4 text-center">
              {published ? 'Live preview' : 'Preview'}
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
                    Publish to activate this embed on the web.
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
                  {publishing && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {publishing ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            )}

            {/* Snippet — dimmed + non-interactive until published. */}
            <div className={cn(!published && 'opacity-50 pointer-events-none select-none')}>
              <CodeBlock code={format.snippet(AGENT.id)} lang={format.lang} />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-neutral-500 leading-4">
              {format.partner && (
                <span className="inline-flex items-center h-[16px] px-[6px] rounded-full border border-neutral-400 bg-neutral-200 text-[10px] font-[500] text-neutral-600">Integration</span>
              )}
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
            <p className="text-[13.5px] font-[500] text-neutral-900 leading-5">No avatar yet</p>
            <p className="text-[12.5px] text-neutral-500 leading-[1.5]">
              Pick an avatar in Configuration to generate the embed snippet.
            </p>
          </div>
          <button
            onClick={onPickAvatar}
            className="mt-1 h-[30px] px-3.5 rounded-[7.2px] bg-brand text-white text-[13px] font-[500] hover:bg-brand-light cursor-pointer transition-colors"
          >
            Select an avatar
          </button>
        </div>
      )}
    </div>
  )
}

export function AgentDetailPage({ onBack, selectedAvatar, onSelectAvatar }: {
  onBack?: () => void
  selectedAvatar?: Avatar | null
  onSelectAvatar?: (avatar: Avatar | null) => void
}) {
  const [activeTab, setActiveTab] = useState<Tab>('Configuration')
  const [previewOpen, setPreviewOpen] = useState(false)
  const hasFace = !!selectedAvatar
  /* This agent already has a live phone number, so the header shows the
     number + Call▾ (not "Get Phone Number"). */
  const hasPhoneNumber = true

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
      if (hasFace) setActiveTab('Widget')
    }, 1400)
  }

  return (
    <div className="flex flex-col h-full bg-neutral-100">

      {/* Header bar */}
      <div className="shrink-0 h-[44px] flex items-center bg-neutral-100 px-9">
        {/* Left: breadcrumb + id chip + branch */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0 flex-1">
          <nav className="flex items-center gap-1.5 text-[13.5px]">
            <a onClick={onBack} className="text-neutral-600 hover:text-neutral-900 cursor-pointer leading-5">All Agents</a>
            <ChevronRight size={14} strokeWidth={1.17} className="text-neutral-600 shrink-0" />
            <span className="font-[600] text-neutral-900 leading-5">{AGENT.name}</span>
          </nav>
          <span className="inline-flex items-center px-2 py-0.5 rounded-[7.2px] bg-neutral-300 text-[12.5px] text-neutral-600 leading-5 whitespace-nowrap">
            {AGENT.id}
          </span>
          <a className="flex items-center gap-1 text-neutral-500 cursor-pointer">
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
            Preview
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
            {publishing && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {publishing ? 'Publishing…' : 'Publish'}
          </button>

          {/* Live phone number + Call▾ */}
          {hasPhoneNumber && (
            <span className="flex items-center gap-1.5 ml-1 text-[13px] text-neutral-600 whitespace-nowrap">
              <Hash size={14} strokeWidth={1.5} className="text-neutral-500" />
              {AGENT.phoneNumber}
            </span>
          )}
          <CallButton hasNumber={hasPhoneNumber} />
        </div>
      </div>

      {/* Tab navigation — full-width, LEFT-aligned. Single border-b, outside scroll area.
          First tab has no left padding so its text aligns with the header's px-9 baseline. */}
      <div className="shrink-0 h-[44px] flex items-center border-b border-neutral-400 bg-neutral-100">
        <div className="pl-9 pr-9 flex items-center gap-1 h-full overflow-x-auto scrollbar-none">
          {TABS.map((tab, i) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative h-full text-[13.6px] font-[500] text-neutral-900 whitespace-nowrap cursor-pointer transition-opacity shrink-0',
                  isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75',
                  i === 0 ? 'pr-3' : 'px-3',
                )}
              >
                {tab}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-[1px]" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Below the tabs: content (scrolls) | preview panel (docks right) */}
      <div className="flex flex-1 min-h-0">

        {/* Content — own scroll area, centered max-width column (Figma 56:1780) */}
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="px-9 pt-6 max-w-[1200px] w-full mx-auto flex flex-col pb-12">
            {activeTab === 'Configuration' ? (
              <AgentConfigurationTab selectedAvatar={selectedAvatar ?? null} onSelectAvatar={onSelectAvatar ?? (() => {})} />
            ) : activeTab === 'Deployment' ? (
              <>
                {/* Production Version — read-only status of what's live. The
                    "Live on" field shows which channels the version is serving;
                    publishing to production happens from the header Publish button. */}
                <div className="py-4">
                  <h3 className="text-[18.6px] font-[600] text-neutral-900 leading-7">Production Version</h3>
                </div>
                <div className="rounded-[4.32px] px-6 py-8">
                  <div className="grid grid-cols-4 gap-10">
                    <Field label="Version">
                      <span className="font-mono text-[14px] text-neutral-900">{PRODUCTION.version}</span>
                    </Field>
                    <Field label="Status">
                      <span className="flex items-center gap-2">
                        <StatusDot />
                        <span className="text-[13.9px] text-neutral-900">{PRODUCTION.status}</span>
                      </span>
                    </Field>
                    <Field label="Deployed">
                      <span className="text-[13.1px] text-neutral-900">{PRODUCTION.deployed}</span>
                    </Field>
                    <Field
                      label={
                        <span className="flex items-center gap-1">
                          Webhook
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
                    <Field label="Live on">
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
                  <h3 className="text-[18.6px] font-[600] text-neutral-900 leading-7">Version History</h3>
                  <button className="h-[26px] px-2.5 rounded-[5.76px] border border-neutral-400 bg-neutral-100 text-[12.6px] font-[500] text-neutral-900 hover:bg-neutral-200 cursor-pointer">
                    Deploy
                  </button>
                </div>
                <div className="mt-4 border border-neutral-400 rounded-[7.2px] overflow-hidden pt-4">
                  {VERSIONS.map((v, i) => (
                    <VersionRow key={v.id} version={v} last={i === VERSIONS.length - 1} />
                  ))}
                </div>
              </>
            ) : activeTab === 'Widget' ? (
              <>
                {/* Widget — the agent's embeddable web surface (ElevenLabs/Anam
                    pattern). Snippet + live preview live on their own tab, not
                    buried in Deployment. */}
                <div className="py-4">
                  <h3 className="text-[18.6px] font-[600] text-neutral-900 leading-7">Widget</h3>
                  <p className="text-[13px] text-neutral-500 leading-5 mt-0.5">
                    Embed your agent in a website or app. The snippet stays in sync with your published version.
                  </p>
                </div>
                <WebEmbedSection
                  avatar={selectedAvatar ?? null}
                  published={avatarPublished}
                  onPickAvatar={() => setActiveTab('Configuration')}
                  onPublish={handlePublish}
                  publishing={publishing}
                />
              </>
            ) : (
              <div className="py-16 flex items-center justify-center">
                <p className="text-[13px] text-neutral-500">{activeTab} — coming soon</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right preview panel — always mounted, slides in/out via width transition ── */}
        <div className={cn(
          'shrink-0 flex flex-col h-full overflow-hidden transition-[width] duration-300 ease-in-out',
          previewOpen ? 'w-[400px]' : 'w-0',
        )}>
          <PreviewPanel onClose={() => setPreviewOpen(false)} hasFace={hasFace} />
        </div>
      </div>
    </div>
  )
}
