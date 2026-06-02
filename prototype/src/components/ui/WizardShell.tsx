import { type ReactNode } from 'react'
import { Button } from './Button'
import { ChevronLeft } from 'lucide-react'

interface WizardShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
}

export function WizardShell({ title, subtitle, children, onBack, onNext, nextLabel = 'Next', nextDisabled }: WizardShellProps) {
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[720px] flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-[24px] font-[700] text-neutral-900 leading-tight">{title}</h1>
            {subtitle && <p className="text-[15px] text-neutral-500">{subtitle}</p>}
          </div>
          <div className="bg-bg-surface rounded-[--radius-2xl] border border-border-default p-8 shadow-[--shadow-sm]">
            {children}
          </div>
          <div className="flex items-center justify-between">
            {onBack ? (
              <Button variant="secondary" onClick={onBack}>
                <ChevronLeft size={14} />
                Back
              </Button>
            ) : <div />}
            {onNext && (
              <Button onClick={onNext} disabled={nextDisabled}>
                {nextLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
