import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ── FilterDropdown ────────────────────────────────────────────────
   A real filter popover (replaces the dead FilterButton trigger).
   Trigger reads the active value (or the "any" label) + a chevron; on
   click it opens a card with an optional search box and a checkmark list.
   Single-select: picking an option (or the "any" reset row) closes it.

   Sits on the shared control surface so it matches SearchField and the
   secondary buttons exactly. Closes on outside-click and Escape, the same
   pattern as the Publish split-button. */

export interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  /** Label shown when nothing is selected, and as the reset row (e.g. "Any gender"). */
  anyLabel: string
  options: FilterOption[]
  /** Selected option value, or null for "any". */
  value: string | null
  onChange: (value: string | null) => void
  /** Show an in-popover search box (for longer lists like accents). */
  searchable?: boolean
  className?: string
}

function ChevronGlyph({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      className={cn('shrink-0 text-text-muted transition-transform', open && 'rotate-180')}
    >
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FilterDropdown({
  anyLabel, options, value, onChange, searchable = false, className,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close + reset the search query in one place; every close path routes here.
  function close() {
    setOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = options.find(o => o.value === value)
  const triggerLabel = active?.label ?? anyLabel
  const filtered = searchable && query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  function select(next: string | null) {
    onChange(next)
    close()
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1 h-8 px-[11px] rounded-control border bg-bg-control hover:bg-bg-control-hover text-[11.3px] cursor-pointer transition-colors',
          value !== null
            ? 'border-brand/40 text-text-primary'
            : 'border-border-default text-text-primary',
        )}
      >
        {triggerLabel}
        <ChevronGlyph open={open} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[180px] bg-bg-control border border-border-default rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1.5 z-50">
          {searchable && (
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full h-8 px-2.5 mb-1 rounded-[7px] bg-bg-subtle text-[12.5px] text-text-primary placeholder:text-text-muted outline-none"
            />
          )}
          <div className="max-h-[220px] overflow-y-auto scrollbar-none">
            {/* "Any" reset row */}
            <OptionRow label={anyLabel} selected={value === null} onClick={() => select(null)} />
            {filtered.map(o => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={o.value === value}
                onClick={() => select(o.value)}
              />
            ))}
            {searchable && filtered.length === 0 && (
              <p className="px-2.5 py-2 text-[12px] text-text-muted">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OptionRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-2.5 h-8 rounded-[7px] text-left text-[12.5px] text-text-primary hover:bg-bg-control-hover cursor-pointer transition-colors"
    >
      <span className="truncate">{label}</span>
      {selected && <Check size={14} strokeWidth={2.2} className="shrink-0 text-brand" />}
    </button>
  )
}
