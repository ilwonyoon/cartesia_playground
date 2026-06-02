import { useState } from 'react'
import { Play, Square, ChevronDown, Search } from 'lucide-react'
import { Button } from '../components/ui/Button'

const VOICES = [
  { id: 'v1', name: 'Skylar', tag: 'Friendly Guide', flag: '🇺🇸', desc: 'Approachable American female ideal for customer care and support.', verified: true },
  { id: 'v2', name: 'Corey', tag: 'Supportive Buddy', flag: '🇺🇸', desc: 'Inviting, cheerful young adult male for casual conversation.', verified: true },
  { id: 'v3', name: 'Gemma', tag: 'Decisive Agent', flag: '🇬🇧', desc: 'Confident, emotive British female for professional assistance.', verified: true },
  { id: 'v4', name: 'Archie', tag: 'Approachable Mate', flag: '🇬🇧', desc: 'Warm, conversational British male for casual and engaging dialogue.', verified: true },
  { id: 'v5', name: 'Daniel', tag: 'Modern Assistant', flag: '🇺🇸', desc: 'Clear, crisp male voice for digital assistants and system interactions.', verified: true },
  { id: 'v6', name: 'Katie', tag: 'Friendly Fixer', flag: '🇺🇸', desc: 'Enunciating young adult female for conversational support use cases.', verified: true },
  { id: 'v7', name: 'Lena', tag: 'Warm Guide', flag: '🇩🇪', desc: 'Soft, reassuring German female for healthcare and wellness applications.', verified: false },
  { id: 'v8', name: 'Marco', tag: 'Dynamic Narrator', flag: '🇪🇸', desc: 'Expressive Spanish male with rich tone for storytelling and media.', verified: true },
  { id: 'v9', name: 'Yuki', tag: 'Calm Advisor', flag: '🇯🇵', desc: 'Measured, professional Japanese female for fintech and enterprise.', verified: false },
  { id: 'v10', name: 'Priya', tag: 'Bright Communicator', flag: '🇮🇳', desc: 'Energetic and clear Indian English female for e-learning and training.', verified: true },
]

const FILTERS = ['All', 'English', 'Spanish', 'French', 'German', 'Japanese']

export function VoiceLibraryPage() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const filtered = VOICES.filter(v =>
    (v.name + v.tag + v.desc).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[23.6px] font-[500] text-neutral-900 font-serif">Voice Library</h1>
        <Button size="md">+ Add voice</Button>
      </div>

      {/* Search + language filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search voices..."
            className="w-full h-9 pl-8 pr-4 rounded-[8px] border border-neutral-400 bg-white text-[13px] placeholder:text-neutral-500 outline-none focus:border-neutral-600"
          />
        </div>
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-3 rounded-[6px] text-[12px] font-[500] transition-colors cursor-pointer
                ${filter === f
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-200'
                }`}
            >
              {f}
            </button>
          ))}
          <button className="h-8 px-3 rounded-[6px] text-[12px] font-[500] text-neutral-600 hover:bg-neutral-200 flex items-center gap-1">
            More <ChevronDown size={11} />
          </button>
        </div>
      </div>

      {/* Voice list */}
      <div className="border border-neutral-400 rounded-[10px] bg-white overflow-hidden">
        {filtered.map((voice, i) => (
          <div
            key={voice.id}
            className={`flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors ${i > 0 ? 'border-t border-neutral-400' : ''}`}
          >
            {/* Play button */}
            <button
              onClick={() => setPlaying(playing === voice.id ? null : voice.id)}
              className="w-8 h-8 rounded-full bg-brand-tint flex items-center justify-center flex-shrink-0 hover:bg-brand/20 transition-colors cursor-pointer"
            >
              {playing === voice.id
                ? <Square size={12} className="text-brand fill-brand" />
                : <Play size={12} className="text-brand fill-brand translate-x-px" />
              }
            </button>

            {/* Flag + name + desc */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-base">{voice.flag}</span>
              <div className="min-w-0">
                <span className="text-[14px] font-[600] text-neutral-900">{voice.name}</span>
                <span className="text-[14px] text-neutral-500"> - {voice.tag}</span>
                {voice.verified && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand text-white text-[9px]">✓</span>
                )}
                <p className="text-[12px] text-neutral-500 truncate">{voice.desc}</p>
              </div>
            </div>

            {/* Use button */}
            <button className="text-[13px] font-[500] text-neutral-700 hover:text-neutral-900 transition-colors flex-shrink-0 cursor-pointer">
              Use
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
