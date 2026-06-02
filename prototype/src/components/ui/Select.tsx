import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'
import { type SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  required?: boolean
  paramStyle?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, required, paramStyle, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="flex items-center gap-1">
          {paramStyle ? (
            <span className="font-mono text-[13px] text-text-muted">{label}</span>
          ) : (
            <span className="text-[14px] font-[500] text-text-primary">{label}</span>
          )}
          {required && <span className="text-text-danger text-[13px]">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'h-9 w-full appearance-none rounded-[--radius-md] border border-border-default bg-bg-surface px-3 pr-8 text-[13px] text-text-primary',
            'outline-none focus:border-border-strong',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
      </div>
    </div>
  )
)
Select.displayName = 'Select'
