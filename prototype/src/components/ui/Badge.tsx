import { cn } from '../../lib/utils'

interface BadgeProps {
  children?: React.ReactNode
  variant?: 'beta' | 'status'
  color?: 'green' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'beta', color = 'green', className }: BadgeProps) {
  if (variant === 'status') {
    return (
      <span
        className={cn(
          'inline-block w-2 h-2 rounded-full',
          color === 'green' ? 'bg-brand-light' : 'bg-neutral-400',
          className
        )}
      />
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[11px] font-[500] leading-none',
        'bg-blue-100 text-blue-700',
        className
      )}
    >
      {children}
    </span>
  )
}
