/**
 * FloatingAvatarWidget — fixed bottom-right, /agents page only.
 * Top-right controls: Mute toggle + X (dismiss).
 * Clicking the card body opens the onboarding modal.
 */
import { useState } from 'react'
import { Volume2, VolumeX, X } from 'lucide-react'
import { AnamPreview } from '../avatar/AnamPreview'
import { FACE_AGENT_GREETING } from './avatarGreeting'

const COVER = '/cartesia_cover.webp'
const HAS_ANAM_KEYS = !!(
  import.meta.env.VITE_ANAM_API_KEY && import.meta.env.VITE_ANAM_PERSONA_ID
)

interface FloatingAvatarWidgetProps {
  onOpenModal: () => void
  hidden?: boolean
}

export function FloatingAvatarWidget({ onOpenModal, hidden = false }: FloatingAvatarWidgetProps) {
  const [muted, setMuted] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  if (hidden || dismissed) return null

  return (
    <div className="fixed bottom-5 right-5 z-40 group" style={{ width: 160 }}>
      <div
        onClick={onOpenModal}
        className="relative rounded-[20px] overflow-hidden cursor-pointer shadow-[0px_4px_8px_rgba(0,0,0,0.08),0px_14px_14px_rgba(0,0,0,0.07),0px_33px_20px_rgba(0,0,0,0.04),0px_56px_23px_rgba(0,0,0,0.01)] transition-transform duration-200 group-hover:scale-[1.02]"
      >
        {/* Avatar or cover fallback */}
        {HAS_ANAM_KEYS ? (
          <AnamPreview
            greeting={FACE_AGENT_GREETING}
            stopAfterGreeting
            outputMuted={muted}
            micEnabled={false}
            className="!aspect-[3/4] rounded-none"
          />
        ) : (
          <div
            className="aspect-[3/4] w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${COVER})` }}
          />
        )}

        {/* Top-right controls: mute + dismiss */}
        <div
          className="absolute top-3 right-3 flex gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {HAS_ANAM_KEYS && (
            <button
              onClick={() => setMuted(m => !m)}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/50 backdrop-blur-[2.5px] border border-white/20 hover:bg-white/70 transition-colors cursor-pointer"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted
                ? <VolumeX size={13} className="text-black/70" />
                : <Volume2 size={13} className="text-black/70" />
              }
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/50 backdrop-blur-[2.5px] border border-white/20 hover:bg-white/70 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={13} className="text-black/70" />
          </button>
        </div>

        {/* CTA pill — bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 pt-8 bg-gradient-to-t from-black/30 to-transparent pointer-events-none">
          <div className="flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-white/50 backdrop-blur-[2.5px] border border-white/20">
            <span className="text-[13px] font-[500] text-black/70 tracking-[-0.26px] whitespace-nowrap">
              Talk with agent
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
