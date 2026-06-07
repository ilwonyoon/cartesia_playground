/**
 * Onboarding modal — 2 layout variations.
 * V1 (69-2059): gradient hero + feature bullets + dual CTA
 * V2 (69-2787): full-bleed player + style tabs + thumbnail gallery
 */
import { useState, useEffect } from 'react'
import { X, Play, ChevronRight, Sparkles, Upload, Mic, Globe, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { AnamPreview } from '../avatar/AnamPreview'

const FEATURES = [
  { Icon: Upload, text: 'Increases engagement by up to 44%' },
  { Icon: Mic,    text: 'Real-time lip-sync powered by Cartesia voice' },
  { Icon: Globe,  text: 'One embed snippet, works anywhere' },
]

type ModalVariant = 'v1' | 'v2'



/* ── Variation 1 — introducing Face Agents ───────────────────── */
function Var1({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="flex flex-col">
      {/* Avatar — inset with padding (floating feel) */}
      <div className="px-4 pt-4">
        <div className="rounded-[14px] overflow-hidden">
          <AnamPreview
            micEnabled={true}
          />
        </div>
      </div>

      <div className="px-5 pt-5 pb-5 flex flex-col gap-5">
        {/* Title */}
        <h2 className="text-[26px] font-[500] text-neutral-900 leading-[1.15] tracking-[-0.3px] font-serif">
          Introducing Face Agents
        </h2>

        {/* Benefits — icon + single line (Dubbing v2 pattern) */}
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
            onClick={onGetStarted}
            className="flex-1 h-10 flex items-center justify-center gap-2 rounded-[9px] border border-neutral-300 bg-white text-[13.5px] font-[500] text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Play size={13} className="text-neutral-500" />
            See it live
          </button>
          <button
            onClick={onGetStarted}
            className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-[9px] bg-brand text-white text-[13.5px] font-[500] hover:bg-brand-light transition-colors cursor-pointer"
          >
            Add to your agent
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Anam avatar type (from GET /v1/avatars) ─────────────────── */
interface AnamAvatar {
  id: string
  displayName: string
  variantName?: string
  imageUrl?: string
}

const ANAM_API_KEY = import.meta.env.VITE_ANAM_API_KEY as string | undefined

async function fetchAvatars(): Promise<AnamAvatar[]> {
  if (!ANAM_API_KEY) return []
  const res = await fetch('https://api.anam.ai/v1/avatars?perPage=50', {
    headers: { Authorization: `Bearer ${ANAM_API_KEY}` },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.avatars ?? data.data ?? []) as AnamAvatar[]
}

/* ── Variation 2 — real Anam player + avatar gallery ─────────── */
function Var2({ onGetStarted }: { onGetStarted: () => void }) {
  const [avatars, setAvatars]       = useState<AnamAvatar[]>([])
  const [loading, setLoading]       = useState(true)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchAvatars().then(list => {
      setAvatars(list)
      if (list.length > 0) setSelectedId(list[0].id)
      setLoading(false)
    })
  }, [])

  const selected = avatars.find(a => a.id === selectedId)

  return (
    <div className="flex flex-col">
      {/* Full-bleed Anam live player */}
      <div className="relative">
        <AnamPreview
          key={selectedId}
          avatarId={selectedId}
          micEnabled={true}
          systemPrompt="You are a friendly demo for Cartesia's 'Give your agent a face' feature. Say hi and briefly explain that users can attach any avatar to their voice agent and embed it on any website. Be warm, concise, enthusiastic. No formatting."
          className="rounded-none"
        />
        {/* Avatar name overlay */}
        {selected && (
          <div className="absolute bottom-3 left-4 text-white/70 text-[12px] font-[500]">
            {selected.displayName}{selected.variantName ? ` · ${selected.variantName}` : ''}
          </div>
        )}
      </div>

      {/* Thumbnail gallery — real imageUrl from API */}
      <div className="px-4 pt-4 pb-1">
        {loading ? (
          <div className="flex items-center gap-2 text-neutral-400 text-[12px] py-2">
            <Loader2 size={14} className="animate-spin" />
            Loading avatars…
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
            {avatars.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div className={cn(
                  'w-16 h-16 rounded-[10px] overflow-hidden bg-neutral-200 flex items-center justify-center transition-all border-2',
                  selectedId === a.id
                    ? 'border-brand scale-105 shadow-md'
                    : 'border-transparent opacity-70 group-hover:opacity-100'
                )}>
                  {a.imageUrl
                    ? <img src={a.imageUrl} alt={a.displayName} className="w-full h-full object-cover" />
                    : <span className="text-[13px] font-[600] text-neutral-500">
                        {a.displayName.slice(0, 2).toUpperCase()}
                      </span>
                  }
                </div>
                <p className="text-[10.5px] text-neutral-500 text-center w-16 truncate leading-tight">
                  {a.displayName}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-5 pt-3">
        <button
          onClick={onGetStarted}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-[9px] bg-neutral-900 text-white text-[13.5px] font-[500] hover:bg-neutral-800 transition-colors cursor-pointer"
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

  /* Animate in/out */
  useEffect(() => {
    if (open) {
      // Small delay so the element mounts before transitioning in
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
        {/* Close button — top right */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>

        {/* Content */}
        {variant === 'v1'
          ? <Var1 onGetStarted={onGetStarted} />
          : <Var2 onGetStarted={onGetStarted} />
        }

        {/* Prototype-only switcher — subtle footer */}
        <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-neutral-100 bg-neutral-50/80">
          <span className="text-[10px] text-neutral-400 mr-0.5">Layout</span>
          {(['v1', 'v2'] as ModalVariant[]).map(v => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={cn(
                'h-5 px-2 rounded-[4px] text-[10px] font-[500] transition-colors cursor-pointer',
                variant === v ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-200'
              )}
            >
              {v === 'v1' ? 'V1 · Hero' : 'V2 · Player'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
