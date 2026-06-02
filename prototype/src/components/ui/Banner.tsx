import { cn } from '../../lib/utils'
import { AlertCircle, Info } from 'lucide-react'

interface BannerProps {
  children: React.ReactNode
  variant?: 'warning' | 'info'
  className?: string
}

export function Banner({ children, variant = 'warning', className }: BannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-4 py-3 rounded-[--radius-md] text-[13px]',
        variant === 'warning' && 'bg-danger/8 text-text-danger border border-danger/20',
        variant === 'info'    && 'bg-bg-brand-tint text-text-brand border border-brand/20',
        className
      )}
    >
      {variant === 'warning'
        ? <AlertCircle size={14} className="flex-shrink-0" />
        : <Info size={14} className="flex-shrink-0" />
      }
      {children}
    </div>
  )
}
