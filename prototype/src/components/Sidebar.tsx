import { Fragment, useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'
import { CartesiaLogo } from './CartesiaLogo'
import { Badge, CountBadge } from './ui/Badge'
import { useAgentStore } from '../lib/agentStore'
import { useContent } from '../content/store'
import {
  IconHome,
  IconTextToSpeech, IconSpeechToText,
  IconVoiceAgents, IconAvatars, IconUploadAvatar, IconAgentMetrics, IconPhoneNumbers,
  IconVoiceLibrary, IconInstantClone, IconProVoiceClone,
  IconLocalizeVoice, IconVoiceChanger, IconPronunciation,
  IconApiKeys, IconSubscription, IconUsage,
  IconDeprecatedModels, IconDocumentation, IconExternalLink
} from './icons'

const HOME_ITEM = { label: '__home', displayLabel: 'Home', Icon: IconHome }

const nav = [
  {
    group: 'Models',
    items: [
      { label: 'Text-to-Speech', Icon: IconTextToSpeech },
      { label: 'Speech-to-Text', Icon: IconSpeechToText },
    ],
  },
  {
    group: 'Agents',
    items: [
      { label: 'Voice Agents', Icon: IconVoiceAgents },
      { label: 'Agent Metrics', Icon: IconAgentMetrics },
      { label: 'Phone Numbers', Icon: IconPhoneNumbers },
    ],
  },
  {
    group: 'Avatars',
    items: [
      { label: 'Avatar Library', Icon: IconAvatars },
      { label: 'Upload Avatar', Icon: IconUploadAvatar },
    ],
  },
  {
    group: 'Voices',
    items: [
      { label: 'Voice Library', Icon: IconVoiceLibrary },
      { label: 'Instant Clone', Icon: IconInstantClone },
      { label: 'Pro Voice Clone', Icon: IconProVoiceClone },
      { label: 'Localize a Voice', Icon: IconLocalizeVoice },
      { label: 'Voice Changer', Icon: IconVoiceChanger },
      { label: 'Pronunciation', Icon: IconPronunciation },
    ],
  },
  {
    group: 'Manage',
    items: [
      { label: 'API Keys', Icon: IconApiKeys },
      { label: 'Subscription', Icon: IconSubscription },
      { label: 'Usage', Icon: IconUsage },
      { label: 'Deprecated Models', Icon: IconDeprecatedModels },
      { label: 'Documentation', Icon: IconDocumentation, external: true },
    ],
  },
]

const ORG_MENU = [
  {
    group: 'Design',
    items: [
      { label: 'Design system', navigate: '__design_system' },
      { label: 'UX writing', navigate: '__content_system' },
      { label: 'Button states', navigate: '__button_states' },
      { label: 'Agent detail (demo)', navigate: '__agent_detail' },
      { label: 'Take-home brief', url: 'http://localhost:5181/notes/cartesia-takehome' },
    ],
  },
  {
    group: 'Tools',
    items: [
      { label: 'Markdown preview', url: 'http://localhost:5181' },
    ],
  },
]

/* ── Agent-scoped navigation (ElevenLabs pattern) ──────────────────
   Opening an agent swaps the global nav for that agent's sections —
   the page itself no longer needs a horizontal tab bar, so the whole
   main column belongs to content. */
const AGENT_SECTIONS = [
  { slug: 'configuration', labelKey: 'shell.nav.section.configuration' },
  { slug: 'flow', labelKey: 'shell.nav.section.flow' },
  { slug: 'deployment', labelKey: 'shell.nav.section.deployment' },
  { slug: 'widget', labelKey: 'shell.nav.section.widget' },
  { slug: 'environment', labelKey: 'shell.nav.section.environment' },
  { slug: 'knowledge-base', labelKey: 'shell.nav.section.knowledge-base' },
  { slug: 'metrics', labelKey: 'shell.nav.section.metrics' },
  { slug: 'calls', labelKey: 'shell.nav.section.calls' },
  { slug: 'settings', labelKey: 'shell.nav.section.settings' },
] as const

export interface AgentNavContext {
  name: string
  builder?: boolean
  /** Active section slug (e.g. "configuration"). */
  activeTab: string
  /** Live counts per section slug (e.g. knowledge-base: 2) — rendered as badges. */
  counts?: Record<string, number>
  onSelectTab: (slug: string) => void
  onBack: () => void
}

interface SidebarProps {
  active?: string
  onNavigate?: (label: string) => void
  onResetDemo?: () => void
  /** When set, the sidebar shows this agent's sections instead of the global nav. */
  agentContext?: AgentNavContext | null
  /** Opens a built agent from the "Your agents" list. */
  onOpenAgent?: (id: string) => void
}

export function Sidebar({ active = 'Voice Agents', onNavigate, onResetDemo, agentContext, onOpenAgent }: SidebarProps) {
  const builtAgents = useAgentStore()
  const t = useContent()
  const [orgOpen, setOrgOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  // Close the agent switcher on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  /* Latch the last agent context so the agent pane can slide OUT showing
     its old content after the route leaves the agent (React's documented
     "storing information from previous renders" pattern). */
  const [lastAgentCtx, setLastAgentCtx] = useState<AgentNavContext | null>(null)
  if (agentContext && agentContext !== lastAgentCtx) setLastAgentCtx(agentContext)
  const displayCtx = agentContext ?? lastAgentCtx
  const inAgent = !!agentContext

  /* Agent-switcher targets: every other built agent, plus the sample agent. */
  const switchTargets = [
    ...builtAgents.filter(a => a.name !== displayCtx?.name).map(a => ({ id: a.id, name: a.name })),
    ...(displayCtx?.name !== 'open-dialogue' ? [{ id: 'demo', name: 'open-dialogue' }] : []),
  ]

  /* "Your agents" under the Voice Agents nav item: newest 3, expandable. */
  const [agentsExpanded, setAgentsExpanded] = useState(false)
  const visibleBuilt = agentsExpanded ? builtAgents : builtAgents.slice(0, 3)
  const hiddenBuiltCount = builtAgents.length - visibleBuilt.length

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOrgOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <aside className="w-[207px] flex-shrink-0 bg-neutral-300 flex flex-col h-screen sticky top-0 overflow-y-auto scrollbar-none border-r border-neutral-400/50">

      {/* Logo — double-click resets demo state (analysis replay, etc.) */}
      <div className="pt-5 pb-2 px-4">
        <div className="pl-1 cursor-pointer" onClick={onResetDemo}>
          <CartesiaLogo width={140} height={20} />
        </div>
      </div>

      {/* Nav slider — the global nav and the agent-scoped nav live on one
          sliding track (drill-in pattern): entering an agent slides the
          global list out left and the agent panel in from the right. */}
      <div className="relative flex-1 min-h-0 overflow-hidden">

      {/* Agent pane */}
      {displayCtx && (
        <nav className={cn(
          'absolute inset-0 px-2 py-2 flex flex-col overflow-y-auto scrollbar-none transition-transform duration-300 ease-in-out',
          inAgent ? 'translate-x-0' : 'translate-x-full',
        )}>
          {/* Agent box — Back on top, identity below; the identity row is a
              dropdown that jumps to any other agent */}
          <div ref={switcherRef} className="relative shrink-0">
            <div className="rounded-[10px] border border-neutral-400/70 bg-neutral-200 overflow-hidden">
              <button
                onClick={displayCtx.onBack}
                className="w-full flex items-center gap-2 px-3 h-8 text-[12.5px] font-[500] text-neutral-600 hover:text-neutral-900 hover:bg-interactive-hover-bg/70 transition-colors cursor-pointer text-left"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t('shell.nav.back-all-agents')}
              </button>
              <div className="border-t border-neutral-400/60" />
              <button
                onClick={() => setSwitcherOpen(v => !v)}
                className="w-full px-3 pt-2.5 pb-2.5 flex flex-col gap-1 text-left cursor-pointer hover:bg-interactive-hover-bg/40 transition-colors"
              >
                <p className="text-[10.5px] font-[500] text-neutral-600 uppercase tracking-wide">
                  {displayCtx.builder ? t('shell.nav.new-agent-eyebrow') : t('shell.nav.agent-eyebrow')}
                </p>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="flex-1 min-w-0 text-[13.5px] font-[600] text-neutral-900 leading-5 truncate">{displayCtx.name}</span>
                  {displayCtx.builder && <Badge size="sm">{t('shell.nav.draft-badge')}</Badge>}
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={cn('text-neutral-500 shrink-0 transition-transform', switcherOpen && '-rotate-180')}
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>

            {switcherOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg-surface border border-border-default rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] overflow-hidden z-50 py-1">
                {switchTargets.length === 0 ? (
                  <p className="px-3 py-2 text-[11.5px] text-neutral-500">{t('shell.nav.switcher-empty')}</p>
                ) : switchTargets.map(target => (
                  <button
                    key={target.id}
                    onClick={() => { setSwitcherOpen(false); onOpenAgent?.(target.id) }}
                    className="w-full flex items-center gap-2 px-3 h-8 text-[13px] font-[500] text-neutral-800 hover:bg-neutral-100 cursor-pointer text-left transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500/50 shrink-0" />
                    <span className="flex-1 truncate">{target.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sections — plain rows, same style as the global nav */}
          <div className="mt-3 flex flex-col gap-0.5">
            {AGENT_SECTIONS.map(({ slug, labelKey }) => {
              const isActive = displayCtx.activeTab === slug
              const count = displayCtx.counts?.[slug] ?? 0
              return (
                <button
                  key={slug}
                  onClick={() => displayCtx.onSelectTab(slug)}
                  className={cn(
                    'w-full flex items-center gap-2 pl-3 pr-2 rounded-[6px] text-[13px] font-[500] leading-5 transition-colors cursor-pointer text-left h-8',
                    isActive
                      ? 'bg-interactive-active-bg text-text-primary'
                      : 'text-neutral-700 hover:bg-interactive-hover-bg',
                  )}
                >
                  <span className="flex-1 truncate">{t(labelKey)}</span>
                  {count > 0 && <CountBadge count={count} />}
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* Global pane */}
      <nav className={cn(
        'absolute inset-0 px-2 py-2 flex flex-col gap-1 overflow-y-auto scrollbar-none transition-transform duration-300 ease-in-out',
        inAgent ? '-translate-x-full' : 'translate-x-0',
      )}>
        {/* Home — standalone, no group label */}
        <button
          onClick={() => onNavigate?.(HOME_ITEM.label)}
          className={cn(
            'w-full flex items-center gap-3 pl-3 pr-2 rounded-[6px] text-[14px] font-[500] leading-5 transition-colors cursor-pointer text-left h-8 mb-4',
            active === HOME_ITEM.label
              ? 'bg-interactive-active-bg text-text-primary'
              : 'text-neutral-700 hover:bg-interactive-hover-bg'
          )}
        >
          <HOME_ITEM.Icon size={16} className={cn('flex-shrink-0', active === HOME_ITEM.label ? 'text-brand' : 'text-neutral-700')} />
          <span className="flex-1">{HOME_ITEM.displayLabel}</span>
        </button>

        {nav.map(({ group, items }) => (
          <Fragment key={group}>
            <div className="flex flex-col gap-0.5 mb-4">
              <p className="pl-3 text-[11.5px] font-[500] text-neutral-600 mb-0.5">
                {group}
              </p>
              {items.map(({ label, Icon, external }) => (
                <Fragment key={label}>
                  <button
                    onClick={() => onNavigate?.(label)}
                    className={cn(
                      'w-full flex items-center gap-3 pl-3 pr-2 rounded-[6px] text-[14px] font-[500] leading-5 transition-colors cursor-pointer text-left h-8',
                      active === label
                        ? 'bg-interactive-active-bg text-text-primary'
                        : 'text-neutral-700 hover:bg-interactive-hover-bg'
                    )}
                  >
                    <Icon size={16} className={cn('flex-shrink-0', active === label ? 'text-brand' : 'text-neutral-700')} />
                    <span className="flex-1">{label}</span>
                    {external && <IconExternalLink size={11} className="text-neutral-400 flex-shrink-0" />}
                  </button>

                  {/* Built agents nest right under Voice Agents — newest 3,
                      expandable, like recent conversations in a chat app. */}
                  {label === 'Voice Agents' && builtAgents.length > 0 && (
                    <div className="flex flex-col gap-0.5 py-0.5">
                      <p className="pl-9 text-[11px] font-[500] text-neutral-500">
                        {t('shell.nav.your-agents')}
                      </p>
                      {visibleBuilt.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => onOpenAgent?.(agent.id)}
                          className="w-full flex items-center gap-2 pl-9 pr-2 rounded-[6px] text-[12.5px] font-[500] leading-4 transition-colors cursor-pointer text-left h-7 text-neutral-700 hover:bg-interactive-hover-bg"
                        >
                          <span className="w-1 h-1 rounded-full bg-neutral-500/50 shrink-0" />
                          <span className="flex-1 truncate">{agent.name}</span>
                        </button>
                      ))}
                      {(hiddenBuiltCount > 0 || agentsExpanded) && (
                        <button
                          onClick={() => setAgentsExpanded(v => !v)}
                          className="w-full flex items-center pl-9 pr-2 rounded-[6px] text-[11.5px] font-[500] leading-4 transition-colors cursor-pointer text-left h-6 text-neutral-500 hover:text-neutral-800"
                        >
                          {agentsExpanded ? t('shell.nav.less') : t('shell.nav.more', { n: hiddenBuiltCount })}
                        </button>
                      )}
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </Fragment>
        ))}
      </nav>

      </div>

      {/* Org switcher + popover */}
      <div className="relative px-3 pt-3 pb-4 border-t border-neutral-400">

        {/* Popover — opens upward */}
        {orgOpen && (
          <div
            ref={popoverRef}
            className="absolute bottom-full left-3 right-3 mb-2 bg-bg-surface border border-border-default rounded-[--radius-lg] shadow-[--shadow-md] overflow-hidden"
          >
            {ORG_MENU.map(({ group, items }, gi) => (
              <div key={group} className={gi > 0 ? 'border-t border-neutral-200' : ''}>
                <p className="px-3 pt-2.5 pb-1 text-[11px] font-[500] text-neutral-500 uppercase tracking-wide">
                  {group}
                </p>
                {items.map((item) => (
                  item.navigate ? (
                    <button
                      key={item.label}
                      onClick={() => { onNavigate?.(item.navigate!); setOrgOpen(false) }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-[500] text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer text-left"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <a
                      key={item.label}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOrgOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-[13px] font-[500] text-neutral-800 hover:bg-neutral-100 transition-colors"
                    >
                      {item.label}
                      <IconExternalLink size={11} className="text-neutral-400" />
                    </a>
                  )
                ))}
              </div>
            ))}
            {/* Divider + org name at bottom of popover */}
            <div className="border-t border-neutral-200 px-3 py-2.5 flex items-center gap-2">
              <div className="w-4 h-4 rounded-[3px] bg-brand flex items-center justify-center text-white text-[9px] font-[700]">I</div>
              <span className="text-[12px] text-neutral-500">Ilwon's organization</span>
            </div>
          </div>
        )}

        {/* Trigger */}
        <div
          ref={triggerRef}
          onClick={() => setOrgOpen(v => !v)}
          className={cn(
            'flex items-center gap-3 px-3 py-1.5 rounded-[6px] cursor-pointer transition-colors select-none',
            orgOpen ? 'bg-neutral-200' : 'hover:bg-neutral-200/70'
          )}
        >
          <div className="w-5 h-5 rounded-[4px] bg-brand flex items-center justify-center text-white text-[10px] font-[700] flex-shrink-0">I</div>
          <span className="text-[13px] font-[500] text-neutral-900 truncate flex-1">Ilwon's organization</span>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={cn('text-neutral-400 flex-shrink-0 transition-transform', orgOpen && '-rotate-180')}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

    </aside>
  )
}
