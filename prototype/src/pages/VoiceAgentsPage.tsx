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

function StatusDot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span className="relative inline-block rounded-full shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full shadow-[0px_0px_0px_1px_white]" />
      <span className="block w-full h-full rounded-full" style={{ backgroundColor: color }} />
    </span>
  )
}

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

function AgentRow({ agent, onClick }: { agent: Agent; onClick?: (id: string) => void }) {
  return (
    <a onClick={() => onClick?.(agent.name)} className="group flex items-center gap-3 px-[23px] py-3.5 rounded-2xl cursor-pointer border border-transparent hover:bg-[#f1f0ed] transition-colors">
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
      <ChevronRight size={16} className="shrink-0 text-neutral-600" strokeWidth={1.33} />
    </a>
  )
}

export function VoiceAgentsPage({ onOpenAgent, onStartAvatar }: { onOpenAgent?: (id: string) => void; onStartAvatar?: () => void }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<StatusKey>('all')

  return (
    <div className="flex flex-col gap-4 max-w-[1088px]">

      {/* Header row */}
      <div className="flex items-center justify-between h-9">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-[500] text-neutral-900 leading-[32px] font-serif">Voice Agents</h1>
          {/* Discovery — promo pill beside title */}
          <button
            onClick={() => onStartAvatar?.()}
            className="group inline-flex items-center gap-2 h-7 pl-1 pr-2.5 rounded-full border border-neutral-300 bg-white hover:border-neutral-400 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center h-5 px-2 rounded-full bg-neutral-900 text-white text-[11px] font-[500] leading-none">
              New
            </span>
            <span className="text-[13px] font-[500] text-neutral-700 whitespace-nowrap">Give your agent a face</span>
          </button>
        </div>
        {/* Create voice agent — primary split button */}
        <div className="flex gap-px p-px">
          <button className="h-[30px] pl-2.5 pr-2.5 bg-brand text-white text-[13.1px] font-[500] rounded-l-[7.2px] flex items-center gap-1.5 hover:bg-brand-light transition-colors cursor-pointer whitespace-nowrap">
            <Plus size={16} strokeWidth={2.2} />
            New agent
          </button>
          <button className="h-[30px] w-[31px] bg-brand text-white rounded-r-[7.2px] flex items-center justify-center hover:bg-brand-light transition-colors cursor-pointer">
            <ChevronDown size={16} strokeWidth={1.33} />
          </button>
        </div>
      </div>

      {/* Search bar — standalone, outside the card */}
      <div className="flex items-center h-[38px] rounded-[8px] border border-neutral-400 bg-white px-px shadow-[--shadow-sm]">
        <span className="flex items-center justify-center pl-3 py-1.5">
          <SearchIcon size={15} className="text-neutral-500" />
        </span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or agent id…"
          className="flex-1 min-w-0 h-9 px-2 bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-500 outline-none"
        />
        <span className="flex items-center gap-1 pr-3 py-1.5">
          <kbd className="h-5 min-w-5 px-1 rounded-[4px] bg-neutral-100 border border-neutral-300 flex items-center justify-center text-[11px] text-neutral-500 leading-4 font-sans">⌘</kbd>
          <kbd className="h-5 min-w-5 px-1.5 rounded-[4px] bg-neutral-100 border border-neutral-300 flex items-center justify-center text-[11px] text-neutral-500 leading-4 font-sans">F</kbd>
        </span>
      </div>

      {/* Filter row — subtle, text-only style */}
      <div className="flex items-center justify-between -mt-1">
        <div className="flex items-center gap-1">
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  'h-7 px-2.5 flex items-center gap-1.5 rounded-[6px] text-[12px] font-[500] cursor-pointer transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-neutral-200/80 text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50',
                )}
              >
                {f.key === 'all' ? (
                  <span className="flex items-center gap-px">
                    <StatusDot color="#00c950" size={7} />
                    <StatusDot color="#fdc700" size={7} />
                    <StatusDot color="#ff6467" size={7} />
                    <StatusDot color="#a1a1a1" size={7} />
                  </span>
                ) : (
                  <StatusDot color={STATUS_DOT[f.key as Exclude<StatusKey, 'all'>]} size={7} />
                )}
                {f.label}
              </button>
            )
          })}
        </div>
        <span className="text-[11.5px] text-neutral-400">
          {AGENTS.length}/{AGENTS.length} agents
        </span>
      </div>

      {/* Card — agent list only */}
      <div className="bg-white border border-neutral-400 rounded-[14px] overflow-hidden shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.06)] -mt-1">
        <div className="flex flex-col">
          {AGENTS
            .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
            .map((agent, i) => (
              <AgentRow key={i} agent={agent} onClick={onOpenAgent} />
            ))}
        </div>
      </div>
    </div>
  )
}
