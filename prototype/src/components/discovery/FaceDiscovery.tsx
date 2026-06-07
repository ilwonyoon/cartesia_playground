/**
 * Discovery entry points for the "Give your agent a face" avatar feature.
 *
 * Four variations, each exploring a different place/affordance for surfacing the
 * new feature in the Voice Agents page. Rendered side-by-side via a switcher so
 * the placement can be compared directly.
 *
 *   A — second action beside "Create voice agent" (split-style)
 *   B — promo pill next to the page title (console's "New · …" pattern)
 *   C — dismissible banner card above the agent list
 *   D — inline "Add a face" hint on each agent row
 */
import { Sparkles, ArrowRight, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type DiscoveryVariant = 'A' | 'B' | 'C' | 'D'

export const DISCOVERY_VARIANTS: { id: DiscoveryVariant; label: string; note: string }[] = [
  { id: 'A', label: 'A · Action button', note: 'Beside “Create voice agent”' },
  { id: 'B', label: 'B · Title pill', note: 'New · … promo next to title' },
  { id: 'C', label: 'C · Banner', note: 'Card above the agent list' },
  { id: 'D', label: 'D · Row hint', note: 'Inline on each agent row' },
]

/** A — a secondary action button next to the primary CTA. */
export function DiscoveryActionButton({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="h-9 px-3.5 flex items-center gap-1.5 rounded-[8px] border border-neutral-400 bg-white text-[13px] font-[500] text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer whitespace-nowrap"
    >
      <Sparkles size={14} className="text-brand" />
      Add a face
    </button>
  )
}

/** B — a small promo pill beside the page title (console "New · Dubbing v2" pattern). */
export function DiscoveryTitlePill({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="group inline-flex items-center gap-2 h-7 pl-1 pr-2.5 rounded-full border border-neutral-300 bg-white hover:border-neutral-400 transition-colors cursor-pointer"
    >
      <span className="inline-flex items-center h-5 px-2 rounded-full bg-neutral-900 text-white text-[11px] font-[500] leading-none">
        New
      </span>
      <span className="text-[13px] font-[500] text-neutral-700">Give your agent a face</span>
      <ArrowRight size={13} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

/** C — a dismissible banner card above the agent list, with a small preview. */
export function DiscoveryBanner({ onStart, onDismiss }: { onStart: () => void; onDismiss?: () => void }) {
  return (
    <div className="relative flex items-center gap-4 rounded-[10px] border border-neutral-400 bg-white px-5 py-4 overflow-hidden">
      {/* Preview swatch — abstract face on brand tint, no new colors */}
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-brand-tint flex items-center justify-center">
        <Sparkles size={18} className="text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-[600] text-neutral-900">Your agents can have a face now</p>
        <p className="text-[13px] text-neutral-500 mt-0.5 leading-snug">
          Add an animated avatar that speaks in your agent’s voice, then embed it on any site.
        </p>
      </div>
      <button
        onClick={onStart}
        className="flex-shrink-0 h-8 px-4 flex items-center gap-1.5 rounded-[8px] bg-brand text-white text-[13px] font-[500] hover:bg-brand-light transition-colors cursor-pointer"
      >
        Try it
        <ArrowRight size={13} />
      </button>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 w-7 h-7 -mr-1.5 rounded-[6px] flex items-center justify-center text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

/** D — an inline "Add a face" hint shown on an agent row (for agents without one). */
export function DiscoveryRowHint({ onStart, className }: { onStart: () => void; className?: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onStart() }}
      className={cn(
        'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-[12px] font-[500]',
        'text-brand bg-brand-tint/60 hover:bg-brand-tint transition-colors cursor-pointer',
        className
      )}
    >
      <Sparkles size={12} />
      Add a face
    </button>
  )
}
