import { cn } from '../../lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helpText?: string
  required?: boolean
  paramStyle?: boolean
  error?: string
  charCount?: { current: number; max: number }
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helpText, required, paramStyle, error, charCount, className, ...props }, ref) => (
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
      <input
        ref={ref}
        className={cn(
          'h-9 w-full rounded-[--radius-md] border border-border-default bg-bg-surface px-3 text-[13px] text-text-primary',
          'placeholder:text-text-secondary outline-none',
          'focus:border-border-strong focus:ring-1 focus:ring-border-strong/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className
        )}
        {...props}
      />
      <div className="flex justify-between">
        {helpText && <span className="text-[11px] text-text-secondary">{helpText}</span>}
        {charCount && (
          <span className="text-[11px] text-text-secondary ml-auto">
            {charCount.current}/{charCount.max}
          </span>
        )}
      </div>
      {error && <span className="text-[11px] text-text-danger">{error}</span>}
    </div>
  )
)
Input.displayName = 'Input'
