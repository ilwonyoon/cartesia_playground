import { cn } from '../../lib/utils'
import { type ButtonHTMLAttributes } from 'react'

/* ── FilterButton ──────────────────────────────────────────────────
   Dropdown / combobox trigger (e.g. "Any gender ▾"). Sits on the shared
   control surface so it matches the search field and secondary buttons
   exactly. Renders its label and a trailing chevron. */

interface FilterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

function ChevronGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-muted">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FilterButton({ label, className, ...props }: FilterButtonProps) {
  return (
    <button
      className={cn(
        'flex items-center gap-1 h-8 px-[11px] rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover text-[11.3px] text-text-primary cursor-pointer transition-colors',
        className,
      )}
      {...props}
    >
      {label}
      <ChevronGlyph />
    </button>
  )
}
