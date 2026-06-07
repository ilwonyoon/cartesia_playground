import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, GitBranch, Check } from 'lucide-react'
import { cn } from '../lib/utils'
import { FloatingAvatarWidget } from '../components/discovery/FloatingAvatarWidget'

/* Search glyph — exact Figma path (56:180), filled not stroked. */
function SearchIcon({ size = 16, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.44444 1.33389C6.4868 1.33392 5.54256 1.55904 4.68791 1.99107C3.83325 2.42311 3.09211 3.04998 2.52426 3.8211C1.9564 4.59223 1.57774 5.48602 1.41882 6.43039C1.2599 7.37476 1.32516 8.34327 1.60935 9.25778C1.89354 10.1723 2.38869 11.0072 3.05486 11.6952C3.72104 12.3831 4.53959 12.9049 5.44448 13.2184C6.34937 13.5318 7.31527 13.6282 8.26426 13.4998C9.21326 13.3713 10.1188 13.0216 10.9078 12.4789L13.0933 14.665L14.665 13.0933L12.4789 10.9078C13.11 9.99028 13.4784 8.91777 13.5443 7.80613C13.6102 6.69448 13.3711 5.58596 12.8528 4.60031C12.3346 3.61467 11.5568 2.78937 10.6036 2.21359C9.65045 1.63781 8.55804 1.33343 7.44444 1.33333M4.30222 4.30222C4.71378 3.88468 5.20389 3.55271 5.74432 3.32542C6.28475 3.09814 6.86481 2.98003 7.45108 2.97792C8.03736 2.9758 8.61825 3.08972 9.16031 3.3131C9.70236 3.53648 10.1949 3.86491 10.6094 4.27947C11.024 4.69404 11.3524 5.18653 11.5758 5.72858C11.7992 6.27064 11.9131 6.85153 11.911 7.43781C11.9089 8.02408 11.7908 8.60414 11.5635 9.14457C11.3362 9.68499 11.0042 10.1751 10.5867 10.5867C9.75124 11.4101 8.62412 11.8699 7.45108 11.8656C6.27805 11.8614 5.15427 11.3935 4.32481 10.5641C3.49534 9.73462 3.02748 8.61084 3.02325 7.43781C3.01902 6.26477 3.47876 5.13765 4.30222 4.30222Z" fill="currentColor"/>
    </svg>
  )
}

type StatusKey = 'all' | 'deployed' | 'deploying' | 'failed' | 'not_deployed'
type AgentStatus = Exclude<StatusKey, 'all'>

const STATUS_DOT: Record<AgentStatus, string> = {
  deployed:     '#00c950',
  deploying:    '#fdc700',
  failed:       '#ff6467',
  not_deployed: '#a1a1a1',
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  deployed:     'Deployed',
  deploying:    'Deploying',
  failed:       'Failed',
  not_deployed: 'Not deployed',
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
  status: AgentStatus
  source: string
  updated: string
  branch?: string
  phoneNumber?: string
}

const AGENTS: Agent[] = [
  { name: 'support-triage-agent',  status: 'deployed',     source: 'Code',       updated: 'Updated 11m ago', branch: 'main' },
  { name: 'appointment-scheduler', status: 'deployed',     source: 'Playground', updated: 'Updated 2h ago',  phoneNumber: '+1 (507) 765-0833' },
  { name: 'onboarding-flow',       status: 'deploying',    source: 'Code',       updated: 'Updated 4m ago',  branch: 'feat/onboarding' },
  { name: 'sales-assistant-v2',    status: 'deploying',    source: 'Code',       updated: 'Updated 1h ago',  branch: 'main', phoneNumber: '+1 (415) 823-4400' },
  { name: 'customer-feedback-bot', status: 'failed',       source: 'Code',       updated: 'Updated 3h ago',  branch: 'main' },
  { name: 'voice-survey-agent',    status: 'not_deployed', source: 'Playground', updated: 'Updated 1d ago' },
  { name: 'multilingual-support',  status: 'not_deployed', source: 'Code',       updated: 'Updated 2d ago',  branch: 'dev' },
]

function AgentRow({ agent, onClick }: { agent: Agent; onClick?: (id: string) => void }) {
  return (
    <a onClick={() => onClick?.(agent.name)} className="flex items-center cursor-pointer group">
      <div className="flex-1 flex items-center gap-5 m-1.5 px-3 py-2 rounded-[10px] group-hover:bg-[#f1f0ed] transition-colors min-w-0">

        {/* Col 1 — name + meta */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <p className="text-[14px] font-[600] text-neutral-900 leading-[20px] truncate">{agent.name}</p>
          <div className="flex items-center gap-1.5 text-[12px] text-neutral-500 leading-4">
            <span>{agent.source}</span>
            <span className="text-neutral-300">·</span>
            <span>{agent.updated}</span>
          </div>
          {agent.branch && (
            <div className="flex items-center gap-1 text-neutral-500 mt-0.5">
              <GitBranch size={12} className="shrink-0" strokeWidth={1.17} />
              <span className="font-mono text-[12px] leading-4">{agent.branch}</span>
            </div>
          )}
        </div>

        {/* Col 2 — phone number */}
        <div className="w-[160px] shrink-0">
          {agent.phoneNumber && (
            <span className="text-[12px] font-[400] text-neutral-600 leading-4">{agent.phoneNumber}</span>
          )}
        </div>

        {/* Col 3 — status + chevron, fixed width so chevron always sits 20px after longest label */}
        <div className="shrink-0 flex items-center gap-5 w-[152px]">
          <div className="flex items-center gap-1.5">
            <StatusDot color={STATUS_DOT[agent.status]} size={8} />
            <span className="text-[12.5px] font-[500] text-neutral-600">{STATUS_LABEL[agent.status]}</span>
          </div>
          <ChevronRight size={15} className="shrink-0 text-neutral-600 ml-auto" strokeWidth={1.5} />
        </div>
      </div>
    </a>
  )
}

function StatusFilterDropdown({ value, onChange }: { value: StatusKey; onChange: (v: StatusKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = FILTERS.find(f => f.key === value)!

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="h-8 pl-3 pr-2.5 flex items-center gap-2 rounded-[8px] border border-neutral-300 bg-white text-[12.5px] font-[500] text-neutral-700 hover:border-neutral-400 transition-colors cursor-pointer"
      >
        {value === 'all' ? (
          <span className="flex items-center gap-px">
            <StatusDot color="#00c950" size={6} />
            <StatusDot color="#fdc700" size={6} />
            <StatusDot color="#ff6467" size={6} />
            <StatusDot color="#a1a1a1" size={6} />
          </span>
        ) : (
          <StatusDot color={STATUS_DOT[value as AgentStatus]} size={7} />
        )}
        {active.label}
        <ChevronDown size={13} className="text-neutral-400" strokeWidth={1.8} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-48 bg-white rounded-[12px] border border-neutral-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1.5 flex flex-col gap-0.5">
          {FILTERS.map(f => {
            const isSelected = value === f.key
            return (
              <button
                key={f.key}
                onClick={() => { onChange(f.key); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] text-neutral-800 transition-colors cursor-pointer text-left',
                  isSelected ? 'bg-neutral-100' : 'hover:bg-neutral-50',
                )}
              >
                {f.key === 'all' ? (
                  <span className="flex items-center gap-px w-4 shrink-0">
                    <StatusDot color="#00c950" size={6} />
                    <StatusDot color="#fdc700" size={6} />
                    <StatusDot color="#ff6467" size={6} />
                  </span>
                ) : (
                  <span className="w-4 flex items-center shrink-0">
                    <StatusDot color={STATUS_DOT[f.key as AgentStatus]} size={8} />
                  </span>
                )}
                <span className="flex-1">{f.label}</span>
                {isSelected && <Check size={13} className="text-neutral-500 shrink-0" strokeWidth={2} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function VoiceAgentsPage({ onOpenAgent, onStartAvatar, modalOpen }: { onOpenAgent?: (id: string) => void; onStartAvatar?: () => void; modalOpen?: boolean }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<StatusKey>('all')

  const filtered = AGENTS.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (activeFilter === 'all' || a.status === activeFilter)
  )

  return (
    <>
    <FloatingAvatarWidget onOpenModal={() => onStartAvatar?.()} hidden={modalOpen} />
    <div className="flex flex-col gap-4 max-w-[1088px]">

      {/* Header row */}
      <div className="flex items-center justify-between h-9">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-[500] text-neutral-900 leading-[32px] font-serif">Voice Agents</h1>
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

      {/* Search bar */}
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

      {/* Count + filter row */}
      <div className="flex items-center justify-between -mt-2">
        <span className="text-[12px] text-neutral-500 font-[500]">
          {filtered.length}/{AGENTS.length} agents
        </span>
        <StatusFilterDropdown value={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* Agent list card */}
      <div className="bg-white border border-neutral-400 rounded-[14px] overflow-hidden shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.06)] -mt-1">
        {filtered.length > 0 ? (
          <div className="flex flex-col">
            {filtered.map((agent, i) => (
              <AgentRow key={i} agent={agent} onClick={onOpenAgent} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-[13px] text-neutral-400">
            No agents match this filter.
          </div>
        )}
      </div>
    </div>
    </>
  )
}
