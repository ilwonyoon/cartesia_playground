import { type ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      {icon && <div className="text-neutral-400 mb-1">{icon}</div>}
      <p className="text-[14px] font-[500] text-neutral-900">{title}</p>
      {description && <p className="text-[13px] text-neutral-500 max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-1">
          + {action.label}
        </Button>
      )}
    </div>
  )
}
