import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, GitBranch } from 'lucide-react'
import { cn } from '../lib/utils'

/* Search glyph — exact Figma path (56:180), filled not stroked. */
function SearchIcon({ size = 16, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.44444 1.33389C6.4868 1.33392 5.54256 1.55904 4.68791 1.99107C3.83325 2.42311 3.09211 3.04998 2.52426 3.8211C1.9564 4.59223 1.57774 5.48602 1.41882 6.43039C1.2599 7.37476 1.32516 8.34327 1.60935 9.25778C1.89354 10.1723 2.38869 11.0072 3.05486 11.6952C3.72104 12.3831 4.53959 12.9049 5.44448 13.2184C6.34937 13.5318 7.31527 13.6282 8.26426 13.4998C9.21326 13.3713 10.1188 13.0216 10.9078 12.4789L13.0933 14.665L14.665 13.0933L12.4789 10.9078C13.11 9.99028 13.4784 8.91777 13.5443 7.80613C13.6102 6.69448 13.3711 5.58596 12.8528 4.60031C12.3346 3.61467 11.5568 2.78937 10.6036 2.21359C9.65045 1.63781 8.55804 1.33343 7.44444 1.33333M4.30222 4.30222C4.71378 3.88468 5.20389 3.55271 5.74432 3.32542C6.28475 3.09814 6.86481 2.98003 7.45108 2.97792C8.03736 2.9758 8.61825 3.08972 9.16031 3.3131C9.70236 3.53648 10.1949 3.86491 10.6094 4.27947C11.024 4.69404 11.3524 5.18653 11.5758 5.72858C11.7992 6.27064 11.9131 6.85153 11.911 7.43781C11.9089 8.02408 11.7908 8.60414 11.5635 9.14457C11.3362 9.68499 11.0042 10.1751 10.5867 10.5867C9.75124 11.4101 8.62412 11.8699 7.45108 11.8656C6.27805 11.8614 5.15427 11.3935 4.32481 10.5641C3.49534 9.73462 3.02748 8.61084 3.02325 7.43781C3.01902 6.26477 3.47876 5.13765 4.30222 4.30222Z" fill="currentColor"/>
    </svg>
  )
}

/* ── Status filter chips ──────────────────────────────────────
   Figma 56:194 — colored dots are OS status signals (not brand green). */
type StatusKey = 'all' | 'deployed' | 'deploying' | 'failed' | 'not_deployed'

const STATUS_DOT: Record<Exclude<StatusKey, 'all'>, string> = {
  deployed:     '#00c950',
  deploying:    '#fdc700',
  failed:       '#ff6467',
  not_deployed: '#a1a1a1',
}

const FILTERS: { key: StatusKey; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'deployed',     label: 'Deployed' },
  { key: 'deploying',    label: 'Deploying' },
  { key: 'failed',       label: 'Failed' },
  { key: 'not_deployed', label: 'Not deployed' },
]

/* A single status dot with the white ring overlay (Figma Overlay+Shadow). */
function StatusDot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      className="relative inline-block rounded-full shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-full shadow-[0px_0px_0px_1px_white]" />
      <span className="block w-full h-full rounded-full" style={{ backgroundColor: color }} />
    </span>
  )
}

/* ── Agent list row (Figma 56:238 / 56:563) ────────────────── */
type Agent = {
  name: string
  status: 'Deployed'
  source: string
  updated: string
  branch?: string
}

const AGENTS: Agent[] = [
  { name: 'support-triage-agent', status: 'Deployed', source: 'Code', updated: 'Updated 11m ago', branch: 'main' },
  { name: 'appointment-scheduler', status: 'Deployed', source: 'Playground', updated: 'Updated 2h ago' },
]

function AgentRow({ agent }: { agent: Agent }) {
  return (
    <a className="flex items-center gap-3 px-[23px] py-3.5 rounded-2xl cursor-pointer border border-transparent hover:bg-[#f1f0ed] transition-colors">
      {/* Name + meta — status shown as a dot before the title */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[14px] font-[500] text-neutral-900 leading-[20px] truncate">{agent.name}</p>
          <StatusDot color={STATUS_DOT.deployed} size={10} />
        </div>
        <div className="flex items-center gap-2 text-[11.5px] text-neutral-600 leading-4">
          <span>{agent.source}</span>
          <span className="text-neutral-600/70">·</span>
          <span>{agent.updated}</span>
        </div>
        {agent.branch && (
          <div className="flex items-center gap-1 text-neutral-600 leading-4">
            <GitBranch size={14} className="shrink-0" strokeWidth={1.17} />
            <span className="font-mono text-[12px]">{agent.branch}</span>
          </div>
        )}
      </div>

      {/* Right: chevron */}
      <ChevronRight size={16} className="shrink-0 text-neutral-600" strokeWidth={1.33} />
    </a>
  )
}

export function VoiceAgentsPage() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<StatusKey>('all')

  return (
    <div className="flex flex-col gap-4 max-w-[1088px]">

      {/* Header row — title left, split button right (Figma 56:164) */}
      <div className="flex items-start justify-between h-9">
        <h1 className="text-[24px] font-[500] text-neutral-900 leading-[32px] font-serif">Voice Agents</h1>
        <div className="flex items-start pt-1">
          <div className="flex gap-px p-px">
            <button className="h-[30px] pl-2.5 pr-2.5 bg-brand text-white text-[13.1px] font-[500] rounded-l-[7.2px] flex items-center gap-1.5 hover:bg-brand-light transition-colors cursor-pointer whitespace-nowrap">
              <Plus size={16} strokeWidth={2.2} />
              Create voice agent
            </button>
            <button className="h-[30px] w-[31px] bg-brand text-white rounded-r-[7.2px] flex items-center justify-center hover:bg-brand-light transition-colors cursor-pointer">
              <ChevronDown size={16} strokeWidth={1.33} />
            </button>
          </div>
        </div>
      </div>

      {/* Card container (Figma 56:176) */}
      <div className="bg-neutral-50 border border-neutral-400 rounded-[10px] overflow-hidden shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] pb-[9px]">

        {/* Search bar row (Figma 56:177) */}
        <div className="bg-[#f1f0ec]/25 border-b border-neutral-400 px-6 pt-[7px] pb-2">
          <div className="flex items-center h-[34px] rounded-[7.2px] border border-neutral-400 bg-neutral-100 px-px">
            <span className="flex items-center justify-center pl-2 py-1.5">
              <SearchIcon size={16} className="text-neutral-600" />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or agent id…"
              className="flex-1 min-w-0 h-8 px-1.5 bg-transparent text-[12.9px] text-neutral-900 placeholder:text-neutral-600 outline-none"
            />
            <span className="flex items-center gap-1 pr-2 py-1.5">
              <kbd className="h-5 min-w-5 px-1 rounded-[4.32px] bg-neutral-300 flex items-center justify-center text-[12px] text-neutral-600 leading-4 font-sans">⌘</kbd>
              <kbd className="h-5 min-w-5 px-1.5 rounded-[4.32px] bg-neutral-300 flex items-center justify-center text-[12px] text-neutral-600 leading-4 font-sans">F</kbd>
            </span>
          </div>
        </div>

        {/* Filter chips row (Figma 56:192) */}
        <div className="border-b border-neutral-400 flex items-center justify-between px-6 pt-2 pb-[9px]">
          <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-x-auto">
            {FILTERS.map(f => {
              const isActive = activeFilter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={cn(
                    'h-8 px-3 flex items-center gap-2 rounded-full whitespace-nowrap shrink-0 text-[12px] font-[500] cursor-pointer transition-colors',
                    isActive
                      ? 'bg-[#f5f5f5] border border-[#d4d4d4] text-neutral-700'
                      : 'border border-neutral-300 text-neutral-600 hover:bg-neutral-100',
                  )}
                >
                  {f.key === 'all' ? (
                    <span className="flex items-center gap-0.5">
                      <StatusDot color="#00c950" />
                      <StatusDot color="#fdc700" />
                      <StatusDot color="#ff6467" />
                      <StatusDot color="#a1a1a1" />
                    </span>
                  ) : (
                    <StatusDot color={STATUS_DOT[f.key as Exclude<StatusKey, 'all'>]} />
                  )}
                  {f.label}
                </button>
              )
            })}
          </div>
          <span className="text-[11.3px] text-neutral-600 whitespace-nowrap pl-3">
            {AGENTS.length}/{AGENTS.length} agents
          </span>
        </div>

        {/* Agent list (Figma 56:237 / 56:562) */}
        <div className="px-px pt-2 flex flex-col">
          {AGENTS
            .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
            .map((agent, i) => (
              <AgentRow key={i} agent={agent} />
            ))}
        </div>
      </div>
    </div>
  )
}
