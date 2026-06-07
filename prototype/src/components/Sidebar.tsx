import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'
import { CartesiaLogo } from './CartesiaLogo'
import {
  IconTextToSpeech, IconSpeechToText,
  IconVoiceAgents, IconAgentMetrics, IconPhoneNumbers,
  IconVoiceLibrary, IconInstantClone, IconProVoiceClone,
  IconLocalizeVoice, IconVoiceChanger, IconPronunciation,
  IconApiKeys, IconSubscription, IconUsage,
  IconDeprecatedModels, IconDocumentation, IconExternalLink
} from './icons'

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

interface SidebarProps {
  active?: string
  onNavigate?: (label: string) => void
}

export function Sidebar({ active = 'Voice Agents', onNavigate }: SidebarProps) {
  const [orgOpen, setOrgOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

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
    <aside className="w-[207px] flex-shrink-0 bg-neutral-300 flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-neutral-400/50">

      {/* Logo */}
      <div className="pt-5 pb-2 px-4">
        <div className="pl-1">
          <CartesiaLogo width={140} height={20} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-6 overflow-y-auto">
        {nav.map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-1">
            <p className="pl-3 text-[11.5px] font-[500] text-neutral-600 mb-0.5">
              {group}
            </p>
            {items.map(({ label, Icon, external }) => (
              <button
                key={label}
                onClick={() => onNavigate?.(label)}
                className={cn(
                  'w-full flex items-center gap-3 pl-3 pr-2 rounded-[6px] text-[13px] font-[500] transition-colors cursor-pointer text-left h-7',
                  active === label
                    ? 'bg-interactive-active-bg text-text-primary'
                    : 'text-text-muted hover:bg-bg-subtle/70'
                )}
              >
                <Icon size={16} className={cn('flex-shrink-0', active === label ? 'text-brand' : 'text-neutral-600')} />
                <span className="flex-1 leading-none">{label}</span>
                {external && <IconExternalLink size={11} className="text-neutral-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        ))}
      </nav>

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
