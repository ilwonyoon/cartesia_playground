import { cn } from '../../lib/utils'

/* ── SearchField ───────────────────────────────────────────────────
   The one search input used across the app. Sits on the shared control
   surface (bg-bg-control + border-border-default + rounded-control) so it
   matches dropdowns and secondary buttons exactly. Shows an optional ⌘F
   keyboard hint on the right. */

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Show the ⌘F shortcut hint on the right (default true). */
  shortcut?: boolean
  className?: string
}

function SearchGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-secondary">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.44444 1.33389C6.4868 1.33392 5.54256 1.55904 4.68791 1.99107C3.83325 2.42311 3.09211 3.04998 2.52426 3.8211C1.9564 4.59223 1.57774 5.48602 1.41882 6.43039C1.2599 7.37476 1.32516 8.34327 1.60935 9.25778C1.89354 10.1723 2.38869 11.0072 3.05486 11.6952C3.72104 12.3831 4.53959 12.9049 5.44448 13.2184C6.34937 13.5318 7.31527 13.6282 8.26426 13.4998C9.21326 13.3713 10.1188 13.0216 10.9078 12.4789L13.0933 14.665L14.665 13.0933L12.4789 10.9078C13.11 9.99028 13.4784 8.91777 13.5443 7.80613C13.6102 6.69448 13.3711 5.58596 12.8528 4.60031C12.3346 3.61467 11.5568 2.78937 10.6036 2.21359C9.65045 1.63781 8.55804 1.33343 7.44444 1.33333M4.30222 4.30222C4.71378 3.88468 5.20389 3.55271 5.74432 3.32542C6.28475 3.09814 6.86481 2.98003 7.45108 2.97792C8.03736 2.9758 8.61825 3.08972 9.16031 3.3131C9.70236 3.53648 10.1949 3.86491 10.6094 4.27947C11.024 4.69404 11.3524 5.18653 11.5758 5.72858C11.7992 6.27064 11.9131 6.85153 11.911 7.43781C11.9089 8.02408 11.7908 8.60414 11.5635 9.14457C11.3362 9.68499 11.0042 10.1751 10.5867 10.5867C9.75124 11.4101 8.62412 11.8699 7.45108 11.8656C6.27805 11.8614 5.15427 11.3935 4.32481 10.5641C3.49534 9.73462 3.02748 8.61084 3.02325 7.43781C3.01902 6.26477 3.47876 5.13765 4.30222 4.30222Z" fill="currentColor" />
    </svg>
  )
}

export function SearchField({ value, onChange, placeholder = 'Search', shortcut = true, className }: SearchFieldProps) {
  return (
    <div className={cn(
      'flex items-center h-[34px] rounded-control border border-border-default bg-bg-control pl-2 pr-0 gap-1.5 focus-within:border-border-strong transition-colors',
      className,
    )}>
      <SearchGlyph />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent text-[13.3px] text-text-muted placeholder:text-text-muted outline-none"
      />
      {shortcut && (
        <div className="flex items-center gap-1 pr-2 shrink-0">
          <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-[6px] bg-bg-subtle text-[12px] text-text-muted leading-none">⌘</kbd>
          <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-[6px] bg-bg-subtle text-[12px] text-text-muted leading-none">F</kbd>
        </div>
      )}
    </div>
  )
}
