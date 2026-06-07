import { useState } from 'react'
import { Phone, GitBranch, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'

/* ── State model ───────────────────────────────────────────────
   published version always exists (v1).
   draft version exists only when there are unpublished edits (v1.1).
   These are separate entities — both can be visible simultaneously. */
type AgentState = {
  hasNumber: boolean   // phone number provisioned
  hasDraft: boolean    // unpublished edits exist (v1.1 Draft)
  callActive: boolean  // call / preview session in progress
}

const SCENARIOS: { label: string; desc: string; state: AgentState }[] = [
  {
    label: 'No number · no draft',
    desc: 'Fresh agent, published, no edits, no phone number.',
    state: { hasNumber: false, hasDraft: false, callActive: false },
  },
  {
    label: 'No number · draft pending',
    desc: 'Agent edited but not published. No phone number yet.',
    state: { hasNumber: false, hasDraft: true, callActive: false },
  },
  {
    label: 'Has number · no draft',
    desc: 'Published, phone provisioned, no pending edits.',
    state: { hasNumber: true, hasDraft: false, callActive: false },
  },
  {
    label: 'Has number · draft pending',
    desc: 'Edited + phone provisioned. Draft ready to publish.',
    state: { hasNumber: true, hasDraft: true, callActive: false },
  },
  {
    label: 'Has number · call in progress',
    desc: 'Active call session running.',
    state: { hasNumber: true, hasDraft: false, callActive: true },
  },
]

/* ── Call split-button with "Send to number" dropdown ─────── */
function CallSplitButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false)
  const [callTo, setCallTo] = useState('+1')

  return (
    <div className="relative flex gap-px">
      <button
        onClick={onToggle}
        className={cn(
          'h-[28px] pl-2.5 pr-3 inline-flex items-center gap-1.5 rounded-l-[--radius-md] text-[12px] font-[500] transition-colors cursor-pointer',
          active ? 'bg-[#5a8a6a] text-white' : 'bg-brand text-white hover:bg-brand-light',
        )}
      >
        <Phone size={13} strokeWidth={0} fill="currentColor" />
        {active ? 'In progress' : 'Call'}
      </button>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'h-[28px] w-[24px] inline-flex items-center justify-center rounded-r-[--radius-md] text-white transition-colors cursor-pointer',
          active ? 'bg-[#5a8a6a] hover:bg-[#4a7a5a]' : 'bg-brand hover:bg-brand-light',
        )}
      >
        <ChevronRight size={13} strokeWidth={1.5} className={cn('transition-transform', open ? 'rotate-90' : '-rotate-90')} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-[240px] bg-white border border-neutral-400 rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-3 z-50">
          <p className="text-[12.5px] font-[600] text-neutral-900 mb-2">Send Call to Phone Number</p>
          <div className="flex items-center gap-2">
            <input
              value={callTo}
              onChange={e => setCallTo(e.target.value)}
              className="flex-1 h-8 px-3 rounded-[6px] border border-neutral-400 bg-white text-[13px] text-neutral-900 outline-none focus:border-neutral-600"
            />
            <button className="w-8 h-8 flex items-center justify-center rounded-[6px] bg-brand text-white hover:bg-brand-light transition-colors cursor-pointer shrink-0">
              <Phone size={14} strokeWidth={0} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Header action group ───────────────────────────────────── */
function HeaderActions({ state, onToggleCall }: {
  state: AgentState
  onToggleCall: () => void
}) {
  const { hasNumber, hasDraft, callActive } = state

  return (
    <div className="flex items-center gap-2 shrink-0">

      {/* Draft badge + Publish */}
      {hasDraft && (
        <span className="text-[12px] font-[500] text-neutral-500">Draft</span>
      )}
      <Button variant="primary" size="sm" disabled={!hasDraft}>
        Publish
      </Button>

      {/* Preview — WebSocket, always visible */}
      <Button variant="secondary" size="sm">
        Preview
      </Button>

      {/* Phone slot — Get Phone Number OR Call (mutually exclusive) */}
      {hasNumber ? (
        <CallSplitButton active={callActive} onToggle={onToggleCall} />
      ) : (
        <Button variant="secondary" size="sm">
          Get Phone Number
        </Button>
      )}

    </div>
  )
}

/* ── Mini header shell ─────────────────────────────────────── */
function HeaderShell({ state, onToggleCall }: {
  state: AgentState
  onToggleCall: () => void
}) {
  return (
    <div className="h-[44px] flex items-center bg-neutral-100 border border-neutral-400 rounded-[8px] px-6 gap-3">
      {/* Identity */}
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        <nav className="flex items-center gap-1.5 text-[13px] shrink-0">
          <span className="text-neutral-500">All Agents</span>
          <ChevronRight size={12} strokeWidth={1.17} className="text-neutral-400" />
          <span className="font-[500] text-neutral-900">open-dialogue</span>
        </nav>
        <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-neutral-300 text-[11.5px] text-neutral-600 leading-5 whitespace-nowrap shrink-0">
          agent_eb6t2Jqe8j…
        </span>
        <span className="flex items-center gap-1 text-neutral-500 shrink-0">
          <GitBranch size={12} strokeWidth={1.33} />
          <span className="text-[12px]">main</span>
        </span>
      </div>

      <HeaderActions state={state} onToggleCall={onToggleCall} />
    </div>
  )
}

/* ── Sandbox page ──────────────────────────────────────────── */
export function ButtonStateSandbox() {
  const [custom, setCustom] = useState<AgentState>({
    hasNumber: false,
    hasDraft: true,
    callActive: false,
  })

  function toggle(key: keyof AgentState) {
    setCustom(s => ({ ...s, [key]: !s[key] }))
  }

  return (
    <div className="flex flex-col gap-10 max-w-[900px]">

      <div>
        <h1 className="text-[22px] font-[500] text-neutral-900 leading-8 font-serif mb-1">
          Header Button States
        </h1>
        <p className="text-[13px] text-neutral-500 leading-5">
          v1 (Published) and v1.1 (Draft) are separate entities — both can coexist.
          Phone group swaps between <strong>Get Phone Number</strong> and <strong>Call</strong>.
        </p>
      </div>

      {/* Scenarios */}
      <div className="flex flex-col gap-5">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Scenarios</p>
        {SCENARIOS.map(({ label, desc, state }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-[12.5px] font-[600] text-neutral-900">{label}</span>
              <span className="text-[12px] text-neutral-500">{desc}</span>
            </div>
            <HeaderShell state={state} onToggleCall={() => {}} />
          </div>
        ))}
      </div>

      {/* Interactive */}
      <div className="flex flex-col gap-4">
        <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wider">Interactive</p>

        <div className="flex items-center gap-6 p-4 bg-neutral-200 rounded-[8px]">
          {([
            ['hasNumber',  'Has phone number'],
            ['hasDraft',   'Has unpublished draft'],
            ['callActive', 'Call in progress'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <button
                role="checkbox"
                aria-checked={custom[key]}
                onClick={() => toggle(key)}
                className={cn(
                  'w-8 h-[18px] rounded-full transition-colors flex items-center shrink-0 px-0.5',
                  custom[key] ? 'bg-brand' : 'bg-neutral-400',
                )}
              >
                <span className={cn(
                  'w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
                  custom[key] ? 'translate-x-[14px]' : 'translate-x-0',
                )} />
              </button>
              <span className="text-[12.5px] font-[500] text-neutral-700">{label}</span>
            </label>
          ))}
        </div>

        <HeaderShell
          state={custom}
          onToggleCall={() => toggle('callActive')}
        />

        <div className="flex items-center gap-4 font-mono text-[11.5px] text-neutral-400">
          {(['hasNumber', 'hasDraft', 'callActive'] as const).map(k => (
            <span key={k} className={custom[k] ? 'text-brand' : ''}>
              {k}={String(custom[k])}
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}
