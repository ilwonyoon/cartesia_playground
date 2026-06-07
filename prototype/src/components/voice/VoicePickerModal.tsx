import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { SearchField } from '../ui/SearchField'
import { FilterButton } from '../ui/FilterButton'
import { VoiceRow } from './VoiceRow'
import {
  VOICES, VOICE_TABS, filterVoices,
  type Voice, type VoiceTabKey, type GenderFilter,
} from '../../data/voices'

/* ── VoicePickerModal (Figma 83:500) ───────────────────────────────
   The "Select a voice" modal opened from a Voice & Language field. It is
   the Voice Library rendered compact: same search / filters / tabs, but
   each row drops the language·gender columns and the Call button. Picking
   a row fires onSelect and closes. */

interface VoicePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (voice: Voice) => void
}

export function VoicePickerModal({ open, onClose, onSelect }: VoicePickerModalProps) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<VoiceTabKey>('Featured')
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('Any gender')
  const [playing, setPlaying] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(open))
    })
    return () => cancelAnimationFrame(raf)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open && !visible) return null

  const filtered = filterVoices(VOICES, { search, gender: genderFilter, tab: activeTab })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Modal card — Figma 83:500 is 768×448; height tuned to show ~5.5 rows */}
      <div className={cn(
        'relative z-10 w-full max-w-[768px] h-[470px] max-h-[88vh] flex flex-col bg-bg-control rounded-[12px] p-2',
        'shadow-[0_20px_60px_-8px_rgba(0,0,0,0.35),0_8px_16px_-4px_rgba(0,0,0,0.15)]',
        'transition-all duration-200 ease-out',
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-11 px-3">
          <span className="text-[16px] font-[500] text-[#39342f]">Select a voice</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[7px] hover:bg-neutral-200 text-neutral-600 cursor-pointer transition-colors"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Search + filters/tabs (no Create button inside the modal) */}
        <div className="px-3 pt-1 pb-2">
          <SearchField value={search} onChange={setSearch} className="mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterButton
                label={genderFilter}
                onClick={() => setGenderFilter(g => g === 'Any gender' ? 'Feminine' : g === 'Feminine' ? 'Masculine' : 'Any gender')}
              />
              <FilterButton label="Tags" />
              <FilterButton label="Any language" />
            </div>
            <div className="flex items-center gap-1">
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
                    <span className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#39342f]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voice rows — scrollable */}
        <div className="flex-1 overflow-y-auto px-3 pb-2 scrollbar-none border-t border-border-default/60 pt-1">
          {filtered.map(voice => (
            <VoiceRow
              key={voice.id}
              voice={voice}
              compact
              playing={playing === voice.id}
              onTogglePlay={() => setPlaying(playing === voice.id ? null : voice.id)}
              onSelect={() => { onSelect(voice); onClose() }}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-[13px] text-neutral-500 text-center py-8">No voices match your search.</p>
          )}
        </div>
      </div>
    </div>
  )
}
