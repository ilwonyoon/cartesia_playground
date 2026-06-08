import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ── AvatarAnalysis ────────────────────────────────────────────────
   Each step is shown immediately in muted text. The active step gets
   a left-to-right shimmer sweep (CSS animation) that gives a "thinking"
   feel. Once the dwell time is up, the step locks in (solid text +
   checkmark) and the next step activates. */

interface AvatarAnalysisProps {
  voiceName: string
  onDone: () => void
}

const STEP_DURATIONS = [3600, 3200, 4000, 2800]
const HOLD_MS = 1200

export function AvatarAnalysis({ voiceName, onDone }: AvatarAnalysisProps) {
  const steps = [
    'Reading your system prompt',
    'Reading your knowledge base',
    `Matching your voice — ${voiceName}`,
    'Finding the best avatar for this agent',
  ]

  const [activeStep, setActiveStep] = useState(0)
  // -1 = none locked yet; grows as steps complete
  const [lockedUpTo, setLockedUpTo] = useState(-1)
  const [leaving, setLeaving] = useState(false)

  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    let elapsed = 0
    steps.forEach((_, i) => {
      elapsed += STEP_DURATIONS[i]
      const t = elapsed
      timers.push(setTimeout(() => {
        setLockedUpTo(i)
        setActiveStep(i + 1)
      }, t))
    })
    const total = elapsed + HOLD_MS
    timers.push(setTimeout(() => setLeaving(true), total))
    timers.push(setTimeout(() => onDoneRef.current(), total + 300))
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-center px-8 transition-opacity duration-300',
        leaving ? 'opacity-0' : 'opacity-100',
      )}
    >
      {/* shimmer keyframes injected once */}
      <style>{`
        @keyframes shimmer-sweep {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #6b7280 0%,
            #6b7280 35%,
            #111827 50%,
            #6b7280 65%,
            #6b7280 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-sweep 2.3s linear infinite;
        }
      `}</style>

      <div className="flex flex-col gap-4 w-full max-w-[280px]">
        {steps.map((label, i) => {
          const isLocked = i <= lockedUpTo
          const isActive = i === activeStep

          return (
            <div key={label} className="flex items-center gap-3">
              <span
                className={cn(
                  'shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded-full transition-all duration-300',
                  isLocked
                    ? 'bg-brand text-white'
                    : isActive
                      ? 'border border-brand/50'
                      : 'border border-neutral-300',
                )}
              >
                {isLocked
                  ? <Check size={10} strokeWidth={3} />
                  : isActive
                    ? <span className="w-1.5 h-1.5 rounded-full bg-brand/70 animate-pulse" />
                    : null}
              </span>

              <span
                className={cn(
                  'text-[13.5px] leading-5 font-[500] transition-colors duration-300',
                  isLocked
                    ? 'text-neutral-700'
                    : isActive
                      ? 'shimmer-text'
                      : 'text-neutral-500',
                )}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
