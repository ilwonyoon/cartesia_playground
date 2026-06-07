import { cn } from '../../lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  badge?: string
  description?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, badge, description, disabled }: ToggleProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          'relative flex-shrink-0 h-5 w-9 rounded-full transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-brand/30',
          checked ? 'bg-brand' : 'bg-neutral-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          checked && 'translate-x-4'
        )} />
      </button>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-[500] text-text-primary">{label}</span>
              {badge && (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-[500] bg-blue-100 text-blue-700">{badge}</span>
              )}
            </div>
          )}
          {description && <p className="text-[12px] text-text-secondary">{description}</p>}
        </div>
      )}
    </div>
  )
}
