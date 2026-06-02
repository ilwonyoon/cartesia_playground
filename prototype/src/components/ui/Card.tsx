import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  selectable?: boolean
  selected?: boolean
  onClick?: () => void
}

export function Card({ children, className, selectable, selected, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[--radius-lg] bg-bg-surface p-6',
        'border border-border-default',
        selectable && 'cursor-pointer transition-all',
        selectable && !selected && 'border-dashed hover:border-border-strong',
        selectable && selected && 'border-solid border-border-strong shadow-[--shadow-md]',
        !selectable && 'shadow-[--shadow-sm]',
        className
      )}
    >
      {children}
    </div>
  )
}
