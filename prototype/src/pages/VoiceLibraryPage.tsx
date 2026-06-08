import { useState } from 'react'
import { cn } from '../lib/utils'
import { SearchField } from '../components/ui/SearchField'
import { FilterDropdown } from '../components/ui/FilterDropdown'
import { VoiceRow } from '../components/voice/VoiceRow'
import { PlusIcon } from '../components/voice/VoiceIcons'
import {
  VOICES, VOICE_TABS, VOICE_LANGUAGES, VOICE_ACCENTS, filterVoices,
  type VoiceTabKey, type GenderFilter,
} from '../data/voices'

/* Filter options derived from the catalog (single source of truth). */
const GENDER_OPTIONS = [
  { value: 'Feminine', label: 'Feminine' },
  { value: 'Masculine', label: 'Masculine' },
]
const LANGUAGE_OPTIONS = VOICE_LANGUAGES.map(l => ({ value: l, label: l }))
const ACCENT_OPTIONS = VOICE_ACCENTS.map(a => ({ value: a, label: a }))

/* ── Voice Library (Figma node 9:362) ──────────────────────────────
   Full-width header bar + 1200px content box. Search / filters / tabs
   sit on the shared control surface; rows are rendered by <VoiceRow>
   (full mode), the same component the compact picker modal reuses. */

export function VoiceLibraryPage() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<VoiceTabKey>('Featured')
  const [gender, setGender] = useState<string | null>(null)
  const [language, setLanguage] = useState<string | null>(null)
  const [accent, setAccent] = useState<string | null>(null)

  const filtered = filterVoices(VOICES, {
    search,
    gender: (gender ?? 'Any gender') as GenderFilter,
    tab: activeTab,
    language,
    accent,
  })

  return (
    <div className="flex flex-col">
      {/* Header bar — full Main width, bottom border (Figma 9:1707) */}
      <div className="h-[60px] flex items-center px-5 bg-[#f9f9f8] border-b border-[#dfdcd7]">
        <span className="text-[13.1px] font-[500] text-[#39342f] leading-5">Voice Library</span>
      </div>

      {/* Body — content constrained to 1200px box */}
      <div className="px-4 pt-6">
        <div className="w-full max-w-[1200px] mx-auto">

          {/* Top toolbar: search + create (Figma 9:366) */}
          <div className="flex items-center gap-2 pb-4">
            <SearchField value={search} onChange={setSearch} className="flex-1" />
            <button className="flex items-center gap-1.5 h-[30px] px-2.5 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover text-[11.3px] font-[500] text-text-muted flex-shrink-0 cursor-pointer transition-colors">
              <PlusIcon />
              Create a voice
            </button>
          </div>

          {/* Tabs (left) + filters (right) — no divider; only the active tab underline */}
          <div className="flex items-center justify-between mb-0">
            <div className="flex items-center gap-1 pb-[5px]">
              {VOICE_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'relative h-[25px] px-[7px] rounded-[8px] font-[500] cursor-pointer transition-colors',
                    activeTab === tab ? 'text-[13.9px] text-[#39342f]' : 'text-[13.3px] text-[#39342f]/60 hover:text-[#39342f]/80',
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute -bottom-[7px] left-0 right-0 h-[2px] bg-[#39342f]" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pb-2">
              <FilterDropdown anyLabel="Any gender" options={GENDER_OPTIONS} value={gender} onChange={setGender} />
              <FilterDropdown anyLabel="Any language" options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />
              <FilterDropdown anyLabel="Any accent" options={ACCENT_OPTIONS} value={accent} onChange={setAccent} searchable />
            </div>
          </div>

          {/* Voice rows */}
          <div>
            {filtered.map(voice => (
              <VoiceRow
                key={voice.id}
                voice={voice}
                playing={playing === voice.id}
                onTogglePlay={() => setPlaying(playing === voice.id ? null : voice.id)}
              />
            ))}
          </div>

        </div>{/* /max-1200 box */}
      </div>{/* /body */}
    </div>
  )
}
