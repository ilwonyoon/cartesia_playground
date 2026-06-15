import { cn } from '../../lib/utils'

/* ── Badge ─────────────────────────────────────────────────────────
   The app's real badge tones, matched to the production console:
     brand   — brand-tint pill: Draft / Ready / Production / Tracing
     neutral — quiet info chip: Avatar / From conversation / Integration
     inverse — the black "New" discovery chip
     beta    — the console's blue "Beta" chip (production pattern; a
               rounded-rect, not a pill, and the one non-brand hue)
   `sm` is the inline chip (18px), `md` the standalone pill (20px). */

type Tone = 'brand' | 'neutral' | 'inverse' | 'beta'
type Size = 'sm' | 'md'

interface BadgeProps {
  children?: React.ReactNode
  tone?: Tone
  size?: Size
  className?: string
}

const tones: Record<Tone, string> = {
  brand:   'rounded-full border border-brand/20 bg-brand-tint text-brand',
  neutral: 'rounded-full border border-border-default bg-bg-subtle text-text-muted',
  inverse: 'rounded-full bg-neutral-900 text-white',
  beta:    'rounded-[4px] bg-info-bg text-info-text',
}

const sizes: Record<Size, string> = {
  sm: 'h-[18px] px-2 text-[10.5px]',
  md: 'h-5 px-[9px] text-[11.8px]',
}

const betaSizes: Record<Size, string> = {
  sm: 'h-[18px] px-1.5 text-[10.5px]',
  md: 'h-5 px-1.5 text-[11px]',
}

export function Badge({ children, tone = 'brand', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-[500] leading-4 whitespace-nowrap shrink-0',
        tones[tone],
        tone === 'beta' ? betaSizes[size] : sizes[size],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* Small circular count — sidebar section badges and the like. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-brand-tint text-brand text-[10px] font-[600] shrink-0',
        className,
      )}
    >
      {count}
    </span>
  )
}
