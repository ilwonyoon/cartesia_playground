import { useState } from 'react'
import { Play, Square, ChevronDown, MoreHorizontal, Bookmark, Phone } from 'lucide-react'
import { cn } from '../lib/utils'

interface Voice {
  id: string
  name: string
  tag: string
  desc: string
  language: string
  accent: string
  gender: 'Feminine' | 'Masculine'
  verified: boolean
  saved?: boolean
}

const VOICES: Voice[] = [
  { id: 'v1', name: 'Skylar', tag: 'Friendly Guide', desc: 'Approachable American female ideal for customer care and support.', language: 'English', accent: 'American', gender: 'Feminine', verified: true },
  { id: 'v2', name: 'Corey', tag: 'Supportive Buddy', desc: 'Inviting, cheerful young adult male for casual conversation.', language: 'English', accent: 'American', gender: 'Masculine', verified: true },
  { id: 'v3', name: 'Gemma', tag: 'Decisive Agent', desc: 'Confident, emotive British female for professional assistance.', language: 'English', accent: 'British', gender: 'Feminine', verified: true },
  { id: 'v4', name: 'Archie', tag: 'Approachable Mate', desc: 'Warm, conversational British male for casual and engaging dialogue.', language: 'English', accent: 'British', gender: 'Masculine', verified: true },
  { id: 'v5', name: 'Daniel', tag: 'Modern Assistant', desc: 'Clear, crisp male voice for digital assistants and system interactions.', language: 'English', accent: 'American', gender: 'Masculine', verified: true },
  { id: 'v6', name: 'Katie', tag: 'Friendly Fixer', desc: 'Enunciating young adult female for conversational support use cases.', language: 'English', accent: 'American', gender: 'Feminine', verified: true },
  { id: 'v7', name: 'Caroline', tag: 'Southern Guide', desc: 'Friendly, inviting, slow young adult female for conversation support.', language: 'English', accent: 'Southern US', gender: 'Feminine', verified: true },
  { id: 'v8', name: 'Blake', tag: 'Helpful Agent', desc: 'Energetic adult male for engaging customer support.', language: 'English', accent: 'American', gender: 'Masculine', verified: true },
  { id: 'v9', name: 'Riya', tag: 'College Roommate', desc: 'Friendly woman for playful conversations.', language: 'Hindi', accent: '', gender: 'Feminine', verified: true, saved: true },
  { id: 'v10', name: 'Cathy', tag: 'Coworker', desc: 'Nice, young adult female for casual conversations.', language: 'English', accent: 'American', gender: 'Feminine', verified: true },
  { id: 'v11', name: 'Arushi', tag: 'Hinglish Speaker', desc: 'Hinglish female for bilingual content.', language: 'Hindi', accent: '', gender: 'Feminine', verified: true, saved: true },
  { id: 'v12', name: 'Theo', tag: 'Modern Narrator', desc: 'Steady, enunciating, confident young male for narrations.', language: 'English', accent: 'American', gender: 'Masculine', verified: true },
]

type TabKey = 'Featured' | 'All voices' | 'My voices' | 'Saved'
const TABS: TabKey[] = ['Featured', 'All voices', 'My voices', 'Saved']

function GenderIcon({ gender }: { gender: 'Feminine' | 'Masculine' }) {
  if (gender === 'Feminine') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-neutral-400 flex-shrink-0">
        <circle cx="10" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 12.5v5M7.5 15.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-neutral-400 flex-shrink-0">
      <circle cx="8.5" cy="11.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 7.5L16.5 3.5M16.5 3.5H13M16.5 3.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function VoiceColorDot({ gender }: { gender: 'Feminine' | 'Masculine' }) {
  return (
    <div className={cn(
      'w-4 h-4 rounded-full flex-shrink-0',
      gender === 'Feminine' ? 'bg-pink-300' : 'bg-blue-300'
    )} />
  )
}

export function VoiceLibraryPage() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('Featured')
  const [genderFilter, setGenderFilter] = useState<'Any gender' | 'Feminine' | 'Masculine'>('Any gender')

  const filtered = VOICES.filter(v => {
    const matchesSearch = (v.name + v.tag + v.desc).toLowerCase().includes(search.toLowerCase())
    const matchesGender = genderFilter === 'Any gender' || v.gender === genderFilter
    const matchesTab = activeTab === 'Saved' ? !!v.saved : true
    return matchesSearch && matchesGender && matchesTab
  })

  return (
    <div className="flex flex-col">
      {/* Top toolbar: search + create */}
      <div className="flex items-center gap-3 pb-4">
        <div className="flex-1 flex items-center h-8 rounded-[7.2px] border border-neutral-300 bg-white px-2.5 gap-2 focus-within:border-neutral-500 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-neutral-400 flex-shrink-0">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-[13px] text-neutral-800 placeholder:text-neutral-400 outline-none min-w-0"
          />
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-[4px] border border-neutral-200 bg-neutral-100 text-[10px] text-neutral-500 font-mono">⌘</kbd>
            <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-[4px] border border-neutral-200 bg-neutral-100 text-[10px] text-neutral-500 font-mono">F</kbd>
          </div>
        </div>

        <button className="flex items-center gap-1.5 h-8 px-3 rounded-[7.2px] bg-neutral-900 hover:bg-neutral-800 text-white text-[13px] font-[500] flex-shrink-0 cursor-pointer transition-colors">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Create a voice
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between pb-0 border-b border-neutral-200">
        <div className="flex items-center gap-2 pb-2">
          <button
            onClick={() => setGenderFilter(g => g === 'Any gender' ? 'Feminine' : g === 'Feminine' ? 'Masculine' : 'Any gender')}
            className="flex items-center gap-1 h-8 px-2.5 rounded-[7.2px] border border-neutral-300 bg-white hover:bg-neutral-50 text-[12.5px] text-neutral-700 cursor-pointer transition-colors"
          >
            {genderFilter}
            <ChevronDown size={13} className="text-neutral-400" />
          </button>
          <button className="flex items-center gap-1 h-8 px-2.5 rounded-[7.2px] border border-neutral-300 bg-white hover:bg-neutral-50 text-[12.5px] text-neutral-700 cursor-pointer transition-colors">
            Tags
            <ChevronDown size={13} className="text-neutral-400" />
          </button>
          <button className="flex items-center gap-1 h-8 px-2.5 rounded-[7.2px] border border-neutral-300 bg-white hover:bg-neutral-50 text-[12.5px] text-neutral-700 cursor-pointer transition-colors">
            Any language
            <ChevronDown size={13} className="text-neutral-400" />
          </button>
        </div>

        <div className="flex items-center">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'relative h-10 px-3 text-[13px] font-[500] cursor-pointer transition-colors',
                activeTab === tab ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-neutral-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Voice list */}
      <div>
        {filtered.map((voice, i) => (
          <div
            key={voice.id}
            className={cn(
              'flex items-center hover:bg-neutral-50/60 transition-colors group',
              i > 0 && 'border-t border-neutral-200'
            )}
            style={{ minHeight: '57px', padding: '8px 0 8px 0' }}
          >
            {/* Play — 48px */}
            <div className="w-12 flex items-center justify-center flex-shrink-0">
              <button
                onClick={() => setPlaying(playing === voice.id ? null : voice.id)}
                className="w-9 h-9 flex items-center justify-center rounded-[7px] hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
              >
                {playing === voice.id
                  ? <Square size={14} className="fill-current" />
                  : <Play size={14} className="fill-current translate-x-[1px]" />
                }
              </button>
            </div>

            {/* Name + desc — flex-1 */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5 mb-[3px]">
                <VoiceColorDot gender={voice.gender} />
                <span className="text-[13.5px] font-[600] text-neutral-900">{voice.name} - {voice.tag}</span>
                {voice.verified && (
                  <span className="inline-flex items-center justify-center w-[13px] h-[13px] rounded-full bg-brand text-white flex-shrink-0" style={{ fontSize: '8px' }}>✓</span>
                )}
              </div>
              <p className="text-[12px] text-neutral-500 leading-[1.4] truncate">{voice.desc}</p>
            </div>

            {/* Language — 160px */}
            <div className="flex-shrink-0 w-40 flex items-center gap-2 pr-4">
              <span className="text-[12.5px] text-neutral-600">{voice.language}</span>
              {voice.accent && (
                <span className="text-[12.5px] text-neutral-400">{voice.accent}</span>
              )}
            </div>

            {/* Gender + save — 120px */}
            <div className="flex-shrink-0 w-28 flex items-center gap-3 pr-2">
              <GenderIcon gender={voice.gender} />
              <button className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" title="Save">
                <Bookmark
                  size={15}
                  className={cn(voice.saved ? 'text-brand fill-brand' : 'text-neutral-400 hover:text-neutral-600')}
                />
              </button>
            </div>

            {/* Actions — 155px */}
            <div className="flex-shrink-0 flex items-center gap-1 pr-1">
              <button className="flex items-center gap-1.5 h-[30px] px-3 rounded-[7px] border border-neutral-300 bg-white hover:bg-neutral-50 text-[12.5px] font-[500] text-neutral-700 cursor-pointer transition-colors">
                <Phone size={12} />
                Call
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-[7px] border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-500 cursor-pointer transition-colors">
                <Bookmark size={13} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-[7px] hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors">
                <MoreHorizontal size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
