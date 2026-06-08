import { cn } from '../../lib/utils'
import { type ButtonHTMLAttributes } from 'react'

/* ── GlassPill ─────────────────────────────────────────────────────
   Frosted-glass pill button that sits over live avatar video (the
   "Talk with agent" / "Play preview" pattern). Translucent white with a
   blur so it reads on any frame. `solid` bumps the opacity for primary
   CTAs over busy footage. */

interface GlassPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Higher opacity for a primary CTA (e.g. Play preview). Default false. */
  solid?: boolean
}

export function GlassPill({ solid = false, className, children, ...props }: GlassPillProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full border transition-colors cursor-pointer',
        solid
          ? 'bg-white/90 hover:bg-white border-black/5 text-neutral-900 shadow-lg'
          : 'bg-white/50 hover:bg-white/70 border-white/20 backdrop-blur-[2.5px] text-black/70',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
