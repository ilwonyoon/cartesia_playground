import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus, GitBranch, Check, Sparkles, FileText } from 'lucide-react'
import { cn } from '../lib/utils'
import { FloatingAvatarWidget } from '../components/discovery/FloatingAvatarWidget'
import { SearchField } from '../components/ui/SearchField'
import { Badge } from '../components/ui/Badge'
import { useAgentStore } from '../lib/agentStore'
import { useContent, type Translate } from '../content/store'

type StatusKey = 'all' | 'deployed' | 'deploying' | 'failed' | 'not_deployed'
type AgentStatus = Exclude<StatusKey, 'all'>

const STATUS_DOT: Record<AgentStatus, string> = {
  deployed:     '#00c950',
  deploying:    '#fdc700',
  failed:       '#ff6467',
  not_deployed: '#a1a1a1',
}

const STATUS_LABEL_KEY: Record<AgentStatus, string> = {
  deployed:     'agents.filter.deployed',
  deploying:    'agents.filter.deploying',
  failed:       'agents.filter.failed',
  not_deployed: 'agents.filter.not-deployed',
}

const FILTERS: { key: StatusKey; labelKey: string }[] = [
  { key: 'all',          labelKey: 'agents.filter.all' },
  { key: 'deployed',     labelKey: 'agents.filter.deployed' },
  { key: 'deploying',    labelKey: 'agents.filter.deploying' },
  { key: 'failed',       labelKey: 'agents.filter.failed' },
  { key: 'not_deployed', labelKey: 'agents.filter.not-deployed' },
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


function timeAgo(ts: number, t: Translate): string {
  const mins = Math.round((Date.now() - ts) / 60000)
  if (mins < 1) return t('agents.updated.just-now')
  if (mins < 60) return t('agents.updated.minutes', { n: mins })
  const hours = Math.round(mins / 60)
  if (hours < 24) return t('agents.updated.hours', { n: hours })
  return t('agents.updated.days', { n: Math.round(hours / 24) })
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
  const t = useContent()
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

        {/* Col 2 — phone number (desktop only) */}
        <div className="hidden md:block w-[160px] shrink-0">
          {agent.phoneNumber && (
            <span className="text-[12px] font-[400] text-neutral-600 leading-4">{agent.phoneNumber}</span>
          )}
        </div>

        {/* Col 3 — status + chevron; fixed width on desktop so the chevron
            aligns, dot-only on phones */}
        <div className="shrink-0 flex items-center gap-3 md:gap-5 w-auto md:w-[152px]">
          <div className="flex items-center gap-1.5">
            <StatusDot color={STATUS_DOT[agent.status]} size={8} />
            <span className="hidden sm:inline text-[12.5px] font-[500] text-neutral-600">{t(STATUS_LABEL_KEY[agent.status])}</span>
          </div>
          <ChevronRight size={15} className="shrink-0 text-neutral-600 ml-auto" strokeWidth={1.5} />
        </div>
      </div>
    </a>
  )
}

function StatusFilterDropdown({ value, onChange }: { value: StatusKey; onChange: (v: StatusKey) => void }) {
  const t = useContent()
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
        className="h-8 pl-3 pr-2.5 flex items-center gap-2 rounded-control border border-border-default bg-bg-control text-[12.5px] font-[500] text-neutral-700 hover:bg-bg-control-hover transition-colors cursor-pointer"
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
        {t(active.labelKey)}
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
                <span className="flex-1">{t(f.labelKey)}</span>
                {isSelected && <Check size={13} className="text-neutral-500 shrink-0" strokeWidth={2} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* "New agent" split button — creation now has two modes, so both halves
   open the chooser: talk the agent into existence, or start from a form. */
function NewAgentSplitButton() {
  const navigate = useNavigate()
  const t = useContent()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-px p-px">
        <button
          onClick={() => setOpen(v => !v)}
          className="h-[30px] pl-2.5 pr-2.5 bg-brand text-white text-[13.1px] font-[500] rounded-l-[7.2px] flex items-center gap-1.5 hover:bg-brand-light transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={2.2} />
          {t('agents.create.cta')}
        </button>
        <button
          onClick={() => setOpen(v => !v)}
          className="h-[30px] w-[31px] bg-brand text-white rounded-r-[7.2px] flex items-center justify-center hover:bg-brand-light transition-colors cursor-pointer"
        >
          <ChevronDown size={16} strokeWidth={1.33} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-[268px] bg-white border border-neutral-400 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-1.5 z-50">
          <button
            onClick={() => navigate('/agents/new/voice')}
            className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[7px] hover:bg-neutral-100 cursor-pointer text-left transition-colors"
          >
            <span className="w-7 h-7 rounded-[7px] bg-brand-tint text-brand flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={15} strokeWidth={1.8} />
            </span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="text-[13px] font-[500] text-neutral-900 leading-4">{t('agents.create.guided.label')}</span>
                <Badge tone="beta" size="sm">{t('agents.create.guided.badge')}</Badge>
              </span>
              <span className="text-[11.5px] text-neutral-500 leading-4">{t('agents.create.guided.hint')}</span>
            </span>
          </button>
          <button
            onClick={() => navigate('/agents/demo')}
            className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[7px] hover:bg-neutral-100 cursor-pointer text-left transition-colors"
          >
            <span className="w-7 h-7 rounded-[7px] bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={15} strokeWidth={1.8} />
            </span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[13px] font-[500] text-neutral-900 leading-4">{t('agents.create.blank.label')}</span>
              <span className="text-[11.5px] text-neutral-500 leading-4">{t('agents.create.blank.hint')}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

export function VoiceAgentsPage({ onOpenAgent, onStartAvatar, modalOpen }: { onOpenAgent?: (id: string) => void; onStartAvatar?: () => void; modalOpen?: boolean }) {
  const t = useContent()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<StatusKey>('all')

  /* Agents built with the voice builder lead the list, chat-app style. */
  const builtAgents = useAgentStore()
  const builtRows: Agent[] = builtAgents.map(a => ({
    name: a.name,
    status: 'not_deployed' as const,
    source: t('agents.source.builder'),
    updated: timeAgo(a.updatedAt, t),
  }))
  const allAgents = [...builtRows, ...AGENTS.filter(a => !builtAgents.some(b => b.id === a.name))]

  const filtered = allAgents.filter(a =>
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
          <h1 className="text-[24px] font-[500] text-neutral-900 leading-[32px] font-serif">{t('agents.title')}</h1>
          <button
            onClick={() => onStartAvatar?.()}
            className="group hidden md:inline-flex items-center gap-2 h-7 pl-1 pr-2.5 rounded-full border border-neutral-300 bg-white hover:border-neutral-400 transition-colors cursor-pointer"
          >
            <Badge tone="inverse">{t('agents.promo.badge')}</Badge>
            <span className="text-[13px] font-[500] text-neutral-700 whitespace-nowrap">{t('agents.promo.label')}</span>
          </button>
        </div>
        <NewAgentSplitButton />
      </div>

      {/* Search bar */}
      <SearchField value={search} onChange={setSearch} placeholder={t('agents.search.placeholder')} />

      {/* Count + filter row */}
      <div className="flex items-center justify-between -mt-2">
        <span className="text-[12px] text-neutral-500 font-[500]">
          {t('agents.count', { shown: filtered.length, total: allAgents.length })}
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
            {t('agents.empty.filtered')}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
