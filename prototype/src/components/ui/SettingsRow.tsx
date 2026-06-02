import { cn } from '../../lib/utils'
import { type ReactNode } from 'react'

interface SettingsRowProps {
  label: string
  description?: string
  children: ReactNode
  className?: string
}

export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-8 py-5 border-b border-neutral-400 last:border-0', className)}>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[14px] font-[500] text-neutral-900">{label}</span>
        {description && <p className="text-[13px] text-neutral-500">{description}</p>}
      </div>
      <div className="flex-shrink-0 min-w-[240px]">{children}</div>
    </div>
  )
}
