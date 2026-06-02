import { useState } from 'react'
import { Search, ChevronDown, Code2 } from 'lucide-react'
import { IconVoiceAgents } from '../components/icons'

export function VoiceAgentsPage() {
  const [hasAgents] = useState(false)
  const [search, setSearch] = useState('')

  return (
    <div className="flex flex-col gap-6">

      {/* Header row — title left, split button right */}
      <div className="flex items-center justify-between">
        <h1 className="text-[23.6px] font-[500] text-neutral-900 leading-none font-serif">Voice Agents</h1>
        <div className="flex items-center">
          <button className="h-9 pl-4 pr-3.5 bg-brand text-white text-[13px] font-[500] rounded-l-[8px] flex items-center gap-1.5 hover:bg-brand-light transition-colors cursor-pointer">
            + Create voice agent
          </button>
          <div className="w-px h-9 bg-white/20" />
          <button className="h-9 px-2.5 bg-brand text-white rounded-r-[8px] flex items-center hover:bg-brand-light transition-colors cursor-pointer">
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full h-9 pl-8 pr-16 rounded-[8px] border border-neutral-400 bg-white text-[13px] placeholder:text-neutral-500 outline-none focus:border-neutral-600"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="text-[11px] text-neutral-400 font-sans">⌘</kbd>
            <kbd className="text-[11px] text-neutral-400 font-sans">F</kbd>
          </span>
        </div>
        <button className="h-9 px-3 flex items-center gap-2 rounded-[8px] border border-neutral-400 bg-white text-[13px] font-[500] text-neutral-700 hover:bg-neutral-50 cursor-pointer whitespace-nowrap">
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block -ml-1" />
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block -ml-1" />
          </span>
          All Statuses
          <ChevronDown size={13} className="text-neutral-400" />
        </button>
      </div>

      {/* Content */}
      {!hasAgents ? (
        /* Empty state — solid border card, centered content */
        <div className="border border-neutral-400 rounded-[10px] flex flex-col items-center justify-center py-16 gap-5">
          {/* Waveform icon in circle */}
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
            <IconVoiceAgents size={18} className="text-neutral-500" />
          </div>
          <p className="text-[15px] font-[500] text-neutral-900">Create a voice agent</p>

          {/* CTA cards — narrower, centered stack */}
          <div className="flex flex-col gap-3 w-full max-w-[420px] mx-auto">
            <div className="bg-white border border-neutral-400 rounded-[10px] px-5 py-4 flex items-start gap-3 hover:border-neutral-600 cursor-pointer transition-colors group">
              <svg className="mt-0.5 text-neutral-500 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <div>
                <p className="text-[14px] font-[600] text-neutral-900">Start in Playground</p>
                <p className="text-[13px] text-neutral-500 mt-0.5 leading-snug">Describe your agent and start calling in seconds. Develop with code later.</p>
              </div>
            </div>
            <div className="bg-white border border-neutral-400 rounded-[10px] px-5 py-4 flex items-start gap-3 hover:border-neutral-600 cursor-pointer transition-colors">
              <Code2 size={16} className="mt-0.5 text-neutral-500 flex-shrink-0" />
              <div>
                <p className="text-[14px] font-[600] text-neutral-900">Start with example code</p>
                <p className="text-[13px] text-neutral-500 mt-0.5 leading-snug">Clone an example to your GitHub for full control. Requires an Anthropic API key.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Populated state */
        <div className="border border-neutral-400 rounded-[10px] bg-white overflow-hidden">
          {['Customer Support Bot', 'Sales Assistant', 'Onboarding Guide']
            .filter(n => n.toLowerCase().includes(search.toLowerCase()))
            .map((name, i) => (
              <div key={name} className={`flex items-center px-5 py-4 hover:bg-neutral-50 cursor-pointer ${i > 0 ? 'border-t border-neutral-400' : ''}`}>
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-2 h-2 rounded-full bg-brand-light flex-shrink-0" />
                  <p className="text-[13px] font-[500] text-neutral-900">{name}</p>
                </div>
                <button className="text-[13px] text-neutral-500 hover:text-neutral-900 px-2">Configure</button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
