/**
 * Onboarding modal — 2 layout variations.
 * V1 (69-2059): gradient hero + feature bullets + dual CTA
 * V2 (69-2787): full-bleed player + persona switcher overlay
 */
import { useState, useEffect } from 'react'
import { Play, ChevronRight, Sparkles, Upload, Mic, Globe } from 'lucide-react'
import { cn } from '../../lib/utils'
import { AnamPreview } from '../avatar/AnamPreview'
import { FACE_AGENT_GREETING } from './avatarGreeting'

const FEATURES = [
  { Icon: Upload, text: 'Increases engagement by up to 44%' },
  { Icon: Mic,    text: 'Real-time lip-sync powered by Cartesia voice' },
  { Icon: Globe,  text: 'One embed snippet, works anywhere' },
]

type ModalVariant = 'v1' | 'v2'

/* ── Variation 1 — introducing Face Agents ───────────────────── */
function Var1({ onGetStarted, onSeeItLive }: { onGetStarted: () => void; onSeeItLive: () => void }) {
  return (
    <div className="flex flex-col">
      {/* Avatar — inset with padding (floating feel) */}
      <div className="px-4 pt-4">
        <div className="rounded-[14px] overflow-hidden">
          <AnamPreview
            greeting={FACE_AGENT_GREETING}
            stopAfterGreeting
          />
        </div>
      </div>

      <div className="px-5 pt-5 pb-5 flex flex-col gap-5">
        {/* Title */}
        <h2 className="text-[26px] font-[500] text-neutral-900 leading-[1.15] tracking-[-0.3px] font-serif">
          Introducing Face Agents
        </h2>

        {/* Benefits */}
        <div className="flex flex-col gap-4">
          {FEATURES.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-brand-tint flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-brand" />
              </div>
              <p className="text-[14px] text-neutral-700 leading-snug">{text}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onSeeItLive}
            className="flex-1 h-10 flex items-center justify-center gap-2 rounded-[9px] border border-neutral-300 bg-white text-[13.5px] font-[500] text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Play size={13} className="text-neutral-500" />
            See it live
          </button>
          <button
            onClick={onGetStarted}
            className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-[9px] bg-brand text-white text-[13.5px] font-[500] hover:opacity-90 transition-opacity cursor-pointer"
          >
            Add to your agent
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Our 3 JTBD personas ─────────────────────────────────────── */
const PERSONAS = [
  {
    id: '05eb3c1f-50ee-42c5-accc-4606bfaa9276',
    displayName: 'Mia',
    role: 'Customer Support',
    greeting: "Hi, I'm Mia! I handle customer support here. Whether it's a billing question, a bug, or just getting started — I've got you. What can I help with?",
    systemPrompt: "You are Mia, a customer support agent for a SaaS product. Be warm, empathetic, and efficient. Help users resolve issues quickly. Keep responses to 2-3 sentences.",
  },
  {
    id: '000391fb-0093-48a8-8135-00eecd43e926',
    displayName: 'Gabriel',
    role: 'Sales',
    greeting: "Hey, I'm Gabriel! I help teams figure out if this is the right fit for them. Tell me a bit about what you're building and I'll be straight with you about whether we can help.",
    systemPrompt: "You are Gabriel, a sales agent. Be enthusiastic, persuasive, and knowledgeable about the product. Focus on value and outcomes. Keep responses to 2-3 sentences.",
  },
  {
    id: '7227cf25-c087-4f14-bcc9-8a1a4e193be8',
    displayName: 'Bella',
    role: 'Patient Coordinator',
    greeting: "Hello, I'm Bella! I'm here to help with appointments, questions about your visit, or anything else you need before coming in. How can I help you today?",
    systemPrompt: "You are Bella, a patient coordinator at a healthcare clinic. Be calm, caring, and professional. Help patients with scheduling and questions. Keep responses to 2-3 sentences.",
  },
]

/* ── Variation 2 — cover + persona selector → live avatar ───── */
const COVER_IMG = '/cartesia_cover.webp'

function Var2({ onGetStarted }: { onGetStarted: () => void }) {
  const [selectedId, setSelectedId] = useState<string>(PERSONAS[0].id)

  const selectedIdx = PERSONAS.findIndex(p => p.id === selectedId)
  const selected = PERSONAS[selectedIdx]

  function handleGreetingDone() {
    const nextIdx = selectedIdx + 1
    if (nextIdx < PERSONAS.length) {
      setSelectedId(PERSONAS[nextIdx].id)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Player area */}
      <div className="relative aspect-video overflow-hidden" style={{ backgroundImage: `url(${COVER_IMG})`, backgroundSize: 'cover' }}>
        <AnamPreview
          key={selectedId}
          avatarId={selectedId}
          greeting={selected.greeting}
          systemPrompt={selected.systemPrompt}
          onGreetingDone={handleGreetingDone}
          className="!aspect-auto absolute inset-0 w-full h-full rounded-none"
        />

        {/* Persona switcher — bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-10 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex gap-2">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  'flex-1 py-1.5 px-2 rounded-[8px] text-center transition-all cursor-pointer',
                  selectedId === p.id
                    ? 'bg-white/20 backdrop-blur-sm border border-white/40'
                    : 'bg-black/20 border border-white/10 opacity-70 hover:opacity-100'
                )}
              >
                <p className="text-[12px] font-[500] text-white">{p.role}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-5 pt-4">
        <button
          onClick={onGetStarted}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-[9px] bg-brand text-white text-[13.5px] font-[500] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Sparkles size={14} />
          Add to yours
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

/* ── Modal shell ─────────────────────────────────────────────── */
interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onGetStarted: () => void
}

export function OnboardingModal({ open, onClose, onGetStarted }: OnboardingModalProps) {
  const [variant, setVariant] = useState<ModalVariant>('v1')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setVariant('v1')
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
    }
  }, [open])

  if (!open && !visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-250',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Modal card */}
      <div className={cn(
        'relative z-10 w-full sm:max-w-[420px] bg-white rounded-[20px] overflow-hidden',
        'shadow-[0_20px_60px_-8px_rgba(0,0,0,0.35),0_8px_16px_-4px_rgba(0,0,0,0.15)]',
        'transition-all duration-300 ease-out',
        visible
          ? 'opacity-100 translate-y-0 sm:scale-100'
          : 'opacity-0 translate-y-4 sm:scale-[0.97]'
      )}>
        {/* Content */}
        {variant === 'v1'
          ? <Var1 onGetStarted={onGetStarted} onSeeItLive={() => setVariant('v2')} />
          : <Var2 onGetStarted={onGetStarted} />
        }
      </div>
    </div>
  )
}
