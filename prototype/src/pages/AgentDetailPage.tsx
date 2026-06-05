import { useState } from 'react'
import {
  ChevronRight, ChevronDown, Phone, GitBranch,
  ExternalLink, MoreVertical,
} from 'lucide-react'
import { cn } from '../lib/utils'

/* ── Agent detail (Figma 56:1715) — full-bleed within AppLayout ──
   Renders the "open-dialogue" agent, Deployment tab active.
   Static visual reconstruction; tabs switch the active underline only. */

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
      <span className="block w-full h-full rounded-full bg-[#00c950]" />
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
    <div className={cn('min-h-[90px] flex items-center px-1', !last && 'border-b border-neutral-400', version.production && 'bg-[#f3f2ef]')}>
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
            <span className="inline-flex items-center h-5 px-[9px] rounded-full border border-neutral-400 bg-[#2b7fff]/15 text-[11.8px] font-[500] text-[#1447e6] leading-4">
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

export function AgentDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Deployment')

  return (
    <div className="flex flex-col min-h-full bg-neutral-100">

      {/* Breadcrumb bar — sticky, full-width (Figma 56:1719) */}
      <div className="sticky top-0 z-10 h-[60px] min-h-[60px] flex items-center px-5 border-b border-neutral-400 bg-neutral-100">
        <nav className="flex items-center gap-1.5 text-[13.5px]">
          <a className="text-neutral-600 hover:text-neutral-900 cursor-pointer leading-5">All Agents</a>
          <ChevronRight size={14} strokeWidth={1.17} className="text-neutral-600" />
          <span className="font-[500] text-neutral-900 leading-5">{AGENT.name}</span>
        </nav>
      </div>

      {/* Scroll area */}
      <div className="flex-1 flex flex-col gap-8 overflow-auto">

        {/* Header block (Figma 56:1731) */}
        <div className="bg-neutral-100">
          {/* Title row */}
          <div className="px-9 pt-6 pb-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap max-w-[700px]">
              <h1 className="text-[22.5px] font-[500] text-neutral-900 leading-8 font-serif whitespace-nowrap">{AGENT.name}</h1>
              <span className="inline-flex items-center px-2 py-1 rounded-[7.2px] bg-neutral-300 text-[13.3px] text-neutral-600 leading-5 whitespace-nowrap">
                {AGENT.id}
              </span>
              <a className="flex items-center gap-1 text-neutral-500 cursor-pointer">
                <GitBranch size={16} strokeWidth={1.33} />
                <span className="text-[14px] leading-5">{AGENT.branch}</span>
              </a>
            </div>

            <div className="flex items-center gap-[9px]">
              <button className="h-[26px] px-2.5 rounded-[5.76px] border border-neutral-400 bg-neutral-100 text-[12.3px] font-[500] text-neutral-900 hover:bg-neutral-200 cursor-pointer whitespace-nowrap">
                Get Phone Number
              </button>
              <div className="flex gap-px p-px">
                <button className="h-[30px] px-2.5 bg-brand text-white rounded-l-[7.2px] flex items-center gap-1.5 hover:bg-brand-light transition-colors cursor-pointer">
                  <Phone size={16} strokeWidth={0} fill="currentColor" />
                  <span className="text-[14px] font-[500] leading-5">Call</span>
                </button>
                <button className="h-[30px] w-[31px] bg-brand text-white rounded-r-[7.2px] flex items-center justify-center hover:bg-brand-light transition-colors cursor-pointer">
                  <ChevronDown size={16} strokeWidth={1.33} />
                </button>
              </div>
            </div>
          </div>

          {/* Tab navigation (Figma 56:1764) */}
          <div className="flex items-center gap-4 px-4 border-b border-neutral-400 overflow-x-auto">
            {TABS.map(tab => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'relative h-8 px-5 py-1 text-[13.6px] font-[500] text-neutral-900 whitespace-nowrap cursor-pointer transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75',
                  )}
                >
                  <span className="leading-6">{tab}</span>
                  {isActive && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-black rounded-t-[1px]" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab content (Figma 56:1780) */}
        <div className="px-9 max-w-[1280px] w-full flex flex-col">
          {activeTab === 'Deployment' ? (
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
    </div>
  )
}
