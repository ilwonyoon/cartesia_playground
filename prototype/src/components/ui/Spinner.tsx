import { cn } from '../../lib/utils'

/* ── Spinner ───────────────────────────────────────────────────────
   The shared loading ring. `inverse` sits on brand/dark fills
   (Publish, Start buttons); `neutral` sits on light surfaces
   (thinking indicators). */

type Tone = 'inverse' | 'neutral'
type Size = 'xs' | 'sm' | 'md' | 'lg'

const tones: Record<Tone, string> = {
  inverse: 'border-white/40 border-t-white',
  neutral: 'border-neutral-300 border-t-neutral-600',
}

const sizes: Record<Size, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function Spinner({ tone = 'neutral', size = 'sm', className }: {
  tone?: Tone
  size?: Size
  className?: string
}) {
  return (
    <span
      className={cn('inline-block border-2 rounded-full animate-spin shrink-0', tones[tone], sizes[size], className)}
    />
  )
}
