import { cn } from '../../lib/utils'
import { type Voice } from '../../data/voices'
import {
  PlayTriangle, StopBars, FeminineIcon, MasculineIcon,
  LanguageGlyph, VerifiedBadge, BookmarkIcon, MenuDots,
} from './VoiceIcons'

/* ── VoiceRow ──────────────────────────────────────────────────────
   One voice in a list. Full mode (Voice Library) shows the language /
   gender columns and a Call button; compact mode (picker modal) drops
   those, so the row collapses to play · name/desc · bookmark · menu.
   When `onSelect` is given the whole row is clickable (picker use). */

interface VoiceRowProps {
  voice: Voice
  playing: boolean
  onTogglePlay: () => void
  compact?: boolean
  onSelect?: () => void
  /** Mark this row as the currently chosen voice (picker use) — shows a badge
      instead of filling the whole row. */
  selected?: boolean
}

export function VoiceRow({ voice, playing, onTogglePlay, compact = false, onSelect, selected = false }: VoiceRowProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        // hover fill + rounded corners (consistent across list and picker)
        'flex items-center rounded-[10px] transition-colors group px-2 hover:bg-[#f5f5f5]',
        onSelect ? 'cursor-pointer' : '',
      )}
      style={{ minHeight: '56.5px', paddingTop: 8, paddingBottom: 8 }}
    >
      {/* Play button — 40px circle, brand-tint fill, no border */}
      <div className="w-14 flex items-center justify-center flex-shrink-0">
        <button
          onClick={e => { e.stopPropagation(); onTogglePlay() }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-tint hover:bg-brand/15 transition-colors cursor-pointer"
        >
          {playing ? <StopBars /> : <PlayTriangle />}
        </button>
      </div>

      {/* Flag + name + desc */}
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-[2px]">
          <span className="text-[15px] leading-none flex-shrink-0">{voice.flag}</span>
          <span className="text-[13.1px] font-[500] text-[#39342f]">{voice.name}</span>
          <span className="text-[13.1px] text-[#737373]">- {voice.tag}</span>
          {voice.verified && <VerifiedBadge />}
          {selected && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-tint text-brand font-[600] tracking-wide uppercase flex-shrink-0">
              Selected
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#737373] leading-[1.48] truncate">{voice.desc}</p>
      </div>

      {/* Language / accent — full mode only */}
      {!compact && (
        <div className="flex-shrink-0 w-[168px] flex items-center gap-1">
          <span className="text-[12px] text-[#737373]">{voice.language}</span>
          {voice.accent && (
            <span className="text-[11.8px] text-[#404040]">{voice.accent}</span>
          )}
        </div>
      )}

      {/* Gender icon + language glyph — full mode only */}
      {!compact && (
        <div className="flex-shrink-0 w-[60px] flex items-center gap-3">
          {voice.gender === 'Feminine' ? <FeminineIcon /> : <MasculineIcon />}
          {voice.accent !== '' && <LanguageGlyph />}
        </div>
      )}

      {/* Trailing actions: Call (full only) + bookmark + menu */}
      <div className="flex-shrink-0 flex items-center gap-2 ml-2 pr-1">
        {!compact && (
          <button
            onClick={e => e.stopPropagation()}
            className="h-[30px] min-w-[70px] px-3 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover text-[12px] font-[500] text-text-primary cursor-pointer transition-colors flex-shrink-0"
          >
            Call
          </button>
        )}
        <button
          onClick={e => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center rounded-control hover:bg-neutral-100 cursor-pointer transition-colors"
        >
          <BookmarkIcon />
        </button>
        <button
          onClick={e => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-neutral-100 cursor-pointer transition-colors"
        >
          <MenuDots />
        </button>
      </div>
    </div>
  )
}
