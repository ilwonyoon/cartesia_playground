import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { AnamPreview } from './AnamPreview'
import {
  AVATARS, INDUSTRY_ORDER, getRecommendedAvatar,
  resolveAnamPersonaId, previewGreeting,
  type Avatar,
} from '../../data/avatars'

/* ── AvatarPickerModal ─────────────────────────────────────────────
   Two-panel popup for choosing a face for a voice agent.
     • Left (larger)  — live Anam preview. Clicking a face streams that
       persona so the user auditions face + paired voice + tone live.
     • Right          — face cards in a grid, filtered by a JTBD tab row
       (All / Finance / Healthcare / …). Each card is a face thumbnail +
       paired-voice line. The face paired with the agent's current voice
       is badged "Recommended". */

interface AvatarPickerModalProps {
  open: boolean
  onClose: () => void
  currentVoice: string
  selectedAvatarId?: string
  onConfirm: (avatar: Avatar) => void
}

type TabKey = 'All' | Avatar['industry']

/* Face thumbnail — real image when available, else an emoji chip. */
function FaceThumb({ avatar, className }: { avatar: Avatar; className?: string }) {
  if (avatar.imageUrl) {
    return <img src={avatar.imageUrl} alt={avatar.name} className={cn('object-cover', className)} />
  }
  return (
    <div className={cn('flex items-center justify-center', avatar.bgColor, className)}>
      <span className="text-[40%] leading-none" style={{ fontSize: '2.4em' }}>{avatar.emoji}</span>
    </div>
  )
}

function AvatarCard({ avatar, active, recommended, onClick }: {
  avatar: Avatar; active: boolean; recommended: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-[12px] overflow-hidden border bg-white text-left transition-all cursor-pointer',
        active ? 'border-brand ring-2 ring-brand/30' : 'border-border-default hover:border-neutral-400',
      )}
    >
      {/* Face image */}
      <div className="relative w-full aspect-[4/5]">
        <FaceThumb avatar={avatar} className="absolute inset-0 w-full h-full" />
        {recommended && (
          <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-brand text-white font-[600] shadow-sm">
            Recommended
          </span>
        )}
        {active && (
          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex items-center justify-center shadow-sm">
            <Check size={12} className="text-white" strokeWidth={3} />
          </span>
        )}
      </div>
      {/* Identity + paired voice */}
      <div className="px-2.5 py-2 border-t border-border-default/60">
        <div className="text-[12.5px] font-[600] text-neutral-900 truncate leading-tight">{avatar.name}</div>
        <div className="text-[11px] text-neutral-500 truncate">{avatar.role}</div>
        <div className="text-[10.5px] text-neutral-400 truncate mt-0.5">{avatar.pairedVoice}</div>
      </div>
    </button>
  )
}

export function AvatarPickerModal({ open, onClose, currentVoice, selectedAvatarId, onConfirm }: AvatarPickerModalProps) {
  const recommended = getRecommendedAvatar(currentVoice)
  const currentVoiceName = currentVoice.split(' - ')[0]

  const [visible, setVisible] = useState(false)
  const [tab, setTab] = useState<TabKey>('All')
  const [previewId, setPreviewId] = useState<string>(
    selectedAvatarId ?? recommended?.id ?? AVATARS[0].id,
  )

  useEffect(() => {
    const seedId = selectedAvatarId ?? recommended?.id ?? AVATARS[0].id
    const raf = requestAnimationFrame(() => {
      if (open) { setPreviewId(seedId); setTab('All') }
      requestAnimationFrame(() => setVisible(open))
    })
    return () => cancelAnimationFrame(raf)
  }, [open, selectedAvatarId, recommended?.id])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open && !visible) return null

  const previewAvatar = AVATARS.find(a => a.id === previewId) ?? AVATARS[0]

  // Tabs: All + only the industries actually present, in canonical order.
  const presentIndustries = INDUSTRY_ORDER.filter(ind => AVATARS.some(a => a.industry === ind))
  const tabs: TabKey[] = ['All', ...presentIndustries]
  const visibleAvatars = tab === 'All' ? AVATARS : AVATARS.filter(a => a.industry === tab)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Modal card */}
      <div className={cn(
        'relative z-10 w-full max-w-[960px] h-[600px] max-h-[88vh] flex flex-col bg-bg-control rounded-[14px] overflow-hidden',
        'shadow-[0_20px_60px_-8px_rgba(0,0,0,0.35),0_8px_16px_-4px_rgba(0,0,0,0.15)]',
        'transition-all duration-200 ease-out',
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-border-default shrink-0">
          <span className="text-[15px] font-[500] text-[#39342f]">Choose an avatar</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[7px] hover:bg-neutral-200 text-neutral-600 cursor-pointer transition-colors"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body: left (large preview) + right (grid) */}
        <div className="flex-1 flex min-h-0">

          {/* Left — live preview, dominant column */}
          <div className="w-[54%] max-w-[520px] flex flex-col p-5 gap-4 border-r border-border-default shrink-0">
            <div className="rounded-[14px] overflow-hidden bg-neutral-900 shadow-sm">
              <AnamPreview
                key={previewAvatar.id}
                avatarId={resolveAnamPersonaId(previewAvatar)}
                greeting={previewGreeting(previewAvatar)}
                systemPrompt={previewAvatar.systemPrompt}
                micEnabled={false}
                showCoverArt={false}
                manualStart
                posterUrl={previewAvatar.imageUrl}
              />
            </div>

            {/* Identity row */}
            <div className="flex items-center gap-3">
              <FaceThumb avatar={previewAvatar} className="w-11 h-11 rounded-full shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-[600] text-neutral-900 truncate">{previewAvatar.name}</span>
                  {recommended?.id === previewAvatar.id && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-tint text-brand font-[600] shrink-0">Recommended</span>
                  )}
                </div>
                <div className="text-[12px] text-neutral-500 truncate">{previewAvatar.role}</div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[12px] text-neutral-500">
                Voice <span className="text-neutral-800 font-[500]">{previewAvatar.pairedVoice}</span>
              </p>
              <p className="text-[11.5px] text-neutral-400 leading-4">
                Face, voice and tone are paired. Pick to apply this set to your agent.
              </p>
            </div>

            <div className="mt-auto flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-9 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover text-[13px] font-[500] text-neutral-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(previewAvatar)}
                className="flex-1 h-9 rounded-control bg-brand text-white text-[13px] font-[500] hover:bg-brand-light cursor-pointer transition-colors"
              >
                Use this avatar
              </button>
            </div>
          </div>

          {/* Right — JTBD tabs + face grid */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-border-default/60 overflow-x-auto scrollbar-none shrink-0">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'h-7 px-3 rounded-full text-[12px] font-[500] whitespace-nowrap cursor-pointer transition-colors',
                    tab === t ? 'bg-brand text-white' : 'text-neutral-600 hover:bg-neutral-200',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Recommended hint (only on All) */}
            {tab === 'All' && recommended && (
              <p className="px-4 pt-2.5 text-[11px] text-neutral-400 leading-4 shrink-0">
                <span className="text-brand font-[600]">Recommended for {currentVoiceName}</span> — keeps your current voice, just adds a face.
              </p>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
              <div className="grid grid-cols-3 gap-3">
                {visibleAvatars.map(avatar => (
                  <AvatarCard
                    key={avatar.id}
                    avatar={avatar}
                    active={previewId === avatar.id}
                    recommended={recommended?.id === avatar.id}
                    onClick={() => setPreviewId(avatar.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
