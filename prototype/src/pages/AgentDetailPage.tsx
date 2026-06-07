import { useState, useRef, useEffect } from 'react'
import {
  ChevronRight, ChevronDown, Phone, GitBranch,
  ExternalLink, MoreVertical, Maximize2, X, Wrench,
  Settings2, Paperclip, ArrowUp,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { AgentConfigurationTab } from './AgentConfigurationTab'

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
  'Configuration', 'Deployment', 'Environment',
  'Knowledge Base', 'Metrics', 'Calls', 'Settings',
] as const
type Tab = (typeof TABS)[number]

const AGENT = {
  name: 'open-dialogue',
  id: 'agent_eb6t2Jqe8jNhyZYbX2gzpn',
  branch: 'main',
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

/* ── Right-side preview/test panel (Figma 77:550 docked widget) ──────
   Docks full-height on the right. Inline|Widget segment + Mock tools
   toggle in its header, a chat-widget placeholder body, message composer
   at the bottom. Send button on brand green. */
type PreviewMode = 'Inline' | 'Widget'

function PreviewPanel({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<PreviewMode>('Widget')
  const [mockTools, setMockTools] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <aside className="w-[400px] shrink-0 flex flex-col h-full border-l border-neutral-400 bg-white">
      {/* Panel toolbar — Inline|Widget · Mock tools · expand · close */}
      <div className="min-h-[48px] flex items-center justify-between gap-2 px-4 border-b border-neutral-400">
        {/* Inline | Widget segmented control */}
        <div className="flex items-center p-0.5 rounded-[7.2px] bg-neutral-200">
          {(['Inline', 'Widget'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'h-[26px] px-3 rounded-[5.76px] text-[12.5px] font-[500] leading-5 cursor-pointer transition-colors',
                mode === m ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Mock tools toggle + expand + close */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMockTools(v => !v)}
            className="h-[26px] px-2 flex items-center gap-1.5 rounded-[5.76px] hover:bg-neutral-200 cursor-pointer"
          >
            <Wrench size={14} strokeWidth={1.5} className="text-neutral-600" />
            <span className="text-[12.5px] font-[500] text-neutral-900 leading-5">Mock tools</span>
            <span className={cn('text-[11.5px] font-[500] leading-4', mockTools ? 'text-brand' : 'text-neutral-500')}>
              {mockTools ? 'On' : 'Off'}
            </span>
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-[5.76px] hover:bg-neutral-200 cursor-pointer">
            <Maximize2 size={15} strokeWidth={1.5} className="text-neutral-600" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[5.76px] hover:bg-neutral-200 cursor-pointer"
          >
            <X size={16} strokeWidth={1.5} className="text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Widget body — empty chat surface */}
      <div className="flex-1 overflow-auto bg-neutral-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 px-8 text-center">
          <span className="w-12 h-12 rounded-full bg-brand-tint flex items-center justify-center">
            <Phone size={20} strokeWidth={0} fill="currentColor" className="text-brand" />
          </span>
          <p className="text-[13px] font-[500] text-neutral-900 leading-5">Test your agent</p>
          <p className="text-[12px] text-neutral-500 leading-4 max-w-[220px]">
            Send a message or start a call to preview {AGENT.name} in {mode.toLowerCase()} mode.
          </p>
        </div>
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-neutral-400 bg-white">
        <div className="flex items-end gap-2 rounded-[10px] border border-neutral-400 bg-neutral-100 px-3 py-2 focus-within:border-neutral-600">
          <button className="w-6 h-6 flex items-center justify-center rounded-[5.76px] hover:bg-neutral-200 cursor-pointer shrink-0">
            <Settings2 size={16} strokeWidth={1.5} className="text-neutral-600" />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded-[5.76px] hover:bg-neutral-200 cursor-pointer shrink-0">
            <Paperclip size={16} strokeWidth={1.5} className="text-neutral-600" />
          </button>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Send a message to start a chat"
            className="flex-1 min-w-0 bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-500 outline-none leading-6"
          />
          <button
            disabled={!draft.trim()}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-brand text-white hover:bg-brand-light transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowUp size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  )
}

/* Phone slot — shows Get Phone Number OR Call▼ depending on provisioning. */
function CallButton({ hasNumber }: { inProgress: boolean; onToggle: () => void; hasNumber: boolean }) {
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
      <button className="h-[30px] px-3 rounded-[7.2px] border border-neutral-400 bg-neutral-100 text-[13px] font-[500] text-neutral-900 hover:bg-neutral-200 cursor-pointer whitespace-nowrap transition-colors">
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

export function AgentDetailPage({ onBack }: { onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('Deployment')
  const [previewOpen, setPreviewOpen] = useState(false)
  /* Toggle to simulate no-number vs provisioned state. */
  const hasPhoneNumber = false
  const hasDraft = true

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

        {/* Right: [Draft] [Publish]  [Preview]  [Get Phone Number | Call▼] */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Draft badge + Publish */}
          {hasDraft && (
            <span className="text-[12px] font-[500] text-neutral-500 leading-none">Draft</span>
          )}
          <button
            disabled={!hasDraft}
            className={cn(
              'h-[30px] px-3 rounded-[7.2px] text-[13px] font-[500] transition-colors',
              hasDraft
                ? 'bg-brand text-white hover:bg-brand-light cursor-pointer'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed',
            )}
          >
            Publish
          </button>

          <div className="w-px h-4 bg-neutral-400 shrink-0" />

          {/* Preview — WebSocket test, opens right panel */}
          <button
            onClick={() => setPreviewOpen(v => !v)}
            className={cn(
              'h-[30px] px-3 rounded-[7.2px] border text-[13px] font-[500] transition-colors cursor-pointer',
              previewOpen
                ? 'border-brand/30 bg-brand-tint text-brand'
                : 'border-neutral-400 bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
            )}
          >
            Preview
          </button>

          <div className="w-px h-4 bg-neutral-400 shrink-0" />

          {/* Phone slot — Get Phone Number OR Call▼ */}
          <CallButton
            inProgress={false}
            onToggle={() => {}}
            hasNumber={hasPhoneNumber}
          />
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
              <AgentConfigurationTab />
            ) : activeTab === 'Deployment' ? (
              <>
                {/* Production Version */}
                <div className="py-4">
                  <h3 className="text-[18.6px] font-[600] text-neutral-900 leading-7">Production Version</h3>
                </div>
                <div className="bg-neutral-200 rounded-[4.32px] px-6 py-8">
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
          <PreviewPanel onClose={() => setPreviewOpen(false)} />
        </div>
      </div>
    </div>
  )
}
