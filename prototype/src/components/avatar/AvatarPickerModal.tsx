import { useState, useEffect } from 'react'
import { X, Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { AnamPreview } from './AnamPreview'
import { VideoPreview } from './VideoPreview'
import {
  AVATARS, INDUSTRY_ORDER, getRecommendedFaces, sortByLivePreview,
  previewGreeting,
  type Avatar,
} from '../../data/avatars'
import { VoiceRow } from '../voice/VoiceRow'
import { SearchField } from '../ui/SearchField'
import {
  VOICES, filterVoices,
  type GenderFilter,
} from '../../data/voices'

/* ── AvatarPickerModal ─────────────────────────────────────────────
   Two-panel popup for composing a face + voice for a voice agent.
     • Left (larger) — live Anam preview (Play-to-start) + two pickers:
       a Face chip and a Voice chip that switch the right panel's mode.
     • Right — three modes:
         Avatar  : face+voice cards grouped by JTBD industry (the pairing)
         Face    : faces only (no voice line)
         Voice   : the compact voice list (same as "Select a voice")
   Face and voice can be chosen independently, but default to the paired
   set; the face whose paired voice matches the agent voice is Recommended. */

type Mode = 'avatar' | 'face' | 'voice'
type FaceTab = 'Recommended' | Avatar['industry']

interface AvatarPickerModalProps {
  open: boolean
  onClose: () => void
  currentVoice: string
  selectedAvatarId?: string
  /** Confirm with the chosen face and the (possibly overridden) voice label. */
  onConfirm: (avatar: Avatar, voiceLabel: string) => void
}

/* Face thumbnail — real image when available, else an emoji chip. */
function FaceThumb({ avatar, className }: { avatar: Avatar; className?: string }) {
  if (avatar.imageUrl) {
    return <img src={avatar.imageUrl} alt={avatar.name} className={cn('object-cover', className)} />
  }
  return (
    <div className={cn('flex items-center justify-center', avatar.bgColor, className)}>
      <span style={{ fontSize: '2.4em' }} className="leading-none">{avatar.emoji}</span>
    </div>
  )
}

function AvatarCard({ avatar, active, recommended, showVoice, voiceLabel, onClick }: {
  avatar: Avatar; active: boolean; recommended: boolean; showVoice: boolean; voiceLabel: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-[12px] overflow-hidden border bg-white text-left transition-all cursor-pointer',
        active ? 'border-brand' : 'border-border-default hover:border-neutral-400',
      )}
    >
      <div className="relative w-full aspect-[4/5]">
        <FaceThumb avatar={avatar} className="absolute inset-0 w-full h-full" />
        {recommended && (
          <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-md bg-white/90 text-brand font-[600] shadow-sm">
            Recommended
          </span>
        )}
        {active && (
          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex items-center justify-center shadow-sm">
            <Check size={12} className="text-white" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="px-2.5 py-2 border-t border-border-default/60">
        <div className="text-[12.5px] font-[600] text-neutral-900 truncate leading-tight">{avatar.name}</div>
        <div className="text-[11.5px] text-neutral-600 truncate">{avatar.role}</div>
        {showVoice && (
          <div className="text-[11px] text-neutral-500 truncate mt-0.5">{voiceLabel}</div>
        )}
      </div>
    </button>
  )
}

/* Left-panel picker — mirrors the Voice & Language dropdown pattern:
   leading glyph + value + trailing chevron. Opens its mode on click. */
function PickerChip({ lead, value, active, onClick }: {
  lead: React.ReactNode; value: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 min-w-0 h-[34px] flex items-center gap-2 pl-3 pr-2.5 rounded-control border bg-bg-control text-left cursor-pointer transition-colors',
        active ? 'border-brand' : 'border-border-default hover:bg-bg-control-hover',
      )}
    >
      <span className="shrink-0 flex items-center">{lead}</span>
      <span className="flex-1 min-w-0 text-[13px] font-[500] text-neutral-900 truncate">{value}</span>
      <ChevronDown size={15} strokeWidth={1.5} className="text-neutral-500 shrink-0" />
    </button>
  )
}

export function AvatarPickerModal({ open, onClose, currentVoice, selectedAvatarId, onConfirm }: AvatarPickerModalProps) {
  const recommendedFaces = getRecommendedFaces()
  const recommended = recommendedFaces[0]
  const recommendedIds = new Set(recommendedFaces.map(a => a.id))

  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<Mode>('avatar')
  const [faceTab, setFaceTab] = useState<FaceTab>('Recommended')
  const [previewId, setPreviewId] = useState<string>(selectedAvatarId ?? recommended?.id ?? AVATARS[0].id)
  const [voiceLabel, setVoiceLabel] = useState<string>(currentVoice)
  // Voice-mode controls
  const [voiceSearch, setVoiceSearch] = useState('')
  const [voiceGender, setVoiceGender] = useState<GenderFilter>('Any gender')
  const [voicePlaying, setVoicePlaying] = useState<string | null>(null)

  useEffect(() => {
    const seedId = selectedAvatarId ?? recommended?.id ?? AVATARS[0].id
    const raf = requestAnimationFrame(() => {
      if (open) {
        setPreviewId(seedId)
        setVoiceLabel(currentVoice)
        setMode('avatar')
        setFaceTab('Recommended')
      }
      requestAnimationFrame(() => setVisible(open))
    })
    return () => cancelAnimationFrame(raf)
  }, [open, selectedAvatarId, recommended?.id, currentVoice])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open && !visible) return null

  const previewAvatar = AVATARS.find(a => a.id === previewId) ?? AVATARS[0]

  // Recommended tab keeps the agent's CURRENT voice (face-only swap); other
  // tabs adopt the face's own paired voice.
  function pickFace(a: Avatar) {
    setPreviewId(a.id)
    setVoiceLabel(faceTab === 'Recommended' ? currentVoice : a.pairedVoice)
  }

  const presentIndustries = INDUSTRY_ORDER.filter(ind => AVATARS.some(a => a.industry === ind))
  const faceTabs: FaceTab[] = ['Recommended', ...presentIndustries]
  const onRecommendedTab = faceTab === 'Recommended'
  // Recommended → curated 3; industry tab → that industry, live faces first.
  const visibleAvatars = onRecommendedTab
    ? recommendedFaces
    : sortByLivePreview(AVATARS.filter(a => a.industry === faceTab))
  const filteredVoices = filterVoices(VOICES, { search: voiceSearch, gender: voiceGender, tab: 'Featured' })
  const voiceObj = VOICES.find(v => `${v.name} - ${v.tag}` === voiceLabel)

  const MODES: { key: Mode; label: string }[] = [
    { key: 'avatar', label: 'Avatar' },
    { key: 'face', label: 'Face' },
    { key: 'voice', label: 'Voice' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div className={cn(
        'relative z-10 w-full max-w-[980px] h-[620px] max-h-[90vh] flex flex-col bg-bg-control rounded-[14px] overflow-hidden',
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

        <div className="flex-1 flex min-h-0">

          {/* Left — preview. Real Anam persona → live call (greeting + mic).
              No persona but a clip → local mp4. Otherwise a still. */}
          <div className="w-[52%] max-w-[500px] flex flex-col p-5 gap-4 border-r border-border-default shrink-0">
            <div className="rounded-[14px] overflow-hidden bg-neutral-900 shadow-sm">
              {previewAvatar.anamPersonaId ? (
                <AnamPreview
                  key={previewAvatar.id}
                  avatarId={previewAvatar.anamPersonaId}
                  greeting={previewGreeting(previewAvatar)}
                  systemPrompt={previewAvatar.systemPrompt}
                  micEnabled
                  showCoverArt={false}
                  manualStart
                  posterUrl={previewAvatar.imageUrl}
                />
              ) : previewAvatar.videoUrl ? (
                <VideoPreview
                  key={previewAvatar.id}
                  posterUrl={previewAvatar.imageUrl}
                  videoUrl={previewAvatar.videoUrl}
                />
              ) : (
                /* No persona or clip — show the still image */
                <div className="relative aspect-video">
                  {previewAvatar.imageUrl
                    ? <img src={previewAvatar.imageUrl} alt={previewAvatar.name} className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0 bg-neutral-900" />}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                    <span className="text-[10.5px] text-white/80 font-[500]">Preview unavailable</span>
                  </div>
                </div>
              )}
            </div>

            {/* Face / Voice pickers → switch right-panel mode (Voice & Language pattern) */}
            <div className="flex items-stretch gap-2">
              <PickerChip
                lead={<FaceThumb avatar={previewAvatar} className="w-5 h-5 rounded-full" />}
                value={previewAvatar.name}
                active={mode === 'face'}
                onClick={() => setMode('face')}
              />
              <PickerChip
                lead={<span className="text-[15px] leading-none">{voiceObj?.flag ?? '🌐'}</span>}
                value={voiceLabel}
                active={mode === 'voice'}
                onClick={() => setMode('voice')}
              />
            </div>

            <p className="text-[12px] text-neutral-500 leading-4">
              {mode === 'voice'
                ? 'Pick a voice — the face stays. Press Play to preview.'
                : mode === 'face'
                  ? 'Pick a face — its paired voice comes along. Press Play to preview.'
                  : 'Face, voice and tone are paired. Press Play to preview, then apply.'}
            </p>

            <div className="mt-auto flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-9 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover text-[13px] font-[500] text-neutral-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(previewAvatar, voiceLabel)}
                className="flex-1 h-9 rounded-control bg-brand text-white text-[13px] font-[500] hover:bg-brand-light cursor-pointer transition-colors"
              >
                Use this avatar
              </button>
            </div>
          </div>

          {/* Right — mode tabs + content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mode tabs: Avatar | Face | Voice (Configuration-tab pattern: same ink,
                opacity for inactive, underline for active) */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-border-default/60 shrink-0">
              {MODES.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={cn(
                    'relative h-8 px-3 text-[13.5px] font-[500] text-neutral-900 whitespace-nowrap cursor-pointer transition-opacity',
                    mode === m.key ? 'opacity-100' : 'opacity-50 hover:opacity-75',
                  )}
                >
                  {m.label}
                  {mode === m.key && <span className="absolute -bottom-px left-1 right-1 h-[2px] bg-black rounded-t-[1px]" />}
                </button>
              ))}
            </div>

            {/* Avatar / Face: industry filter + face grid */}
            {(mode === 'avatar' || mode === 'face') && (
              <>
                {/* Segmented control (Monthly/Annual pattern): active = white pill + shadow */}
                <div className="mx-4 mt-3 mb-1 shrink-0 overflow-x-auto scrollbar-none">
                  <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-neutral-200/70">
                    {faceTabs.map(t => (
                      <button
                        key={t}
                        onClick={() => setFaceTab(t)}
                        className={cn(
                          'h-7 px-3 rounded-full text-[12px] font-[500] whitespace-nowrap cursor-pointer transition-colors',
                          faceTab === t
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900',
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {onRecommendedTab && (
                  <p className="px-4 pt-1.5 text-[11.5px] text-neutral-500 leading-4 shrink-0">
                    Faces picked for this agent — <span className="text-neutral-700 font-[500]">keeps your current voice, just adds a face.</span>
                  </p>
                )}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
                  <div className="grid grid-cols-3 gap-3">
                    {visibleAvatars.map(avatar => (
                      <AvatarCard
                        key={avatar.id}
                        avatar={avatar}
                        active={previewId === avatar.id}
                        // On the Recommended tab the tab itself signals it — badge only top pick.
                        recommended={onRecommendedTab ? avatar.id === recommended?.id : recommendedIds.has(avatar.id)}
                        showVoice={mode === 'avatar'}
                        voiceLabel={onRecommendedTab ? currentVoice : avatar.pairedVoice}
                        onClick={() => pickFace(avatar)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Voice: search + compact voice list (independent of face) */}
            {mode === 'voice' && (
              <>
                <div className="px-4 pt-3 pb-2 shrink-0">
                  <SearchField value={voiceSearch} onChange={setVoiceSearch} className="mb-2" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVoiceGender(g => g === 'Any gender' ? 'Feminine' : g === 'Feminine' ? 'Masculine' : 'Any gender')}
                      className="flex items-center gap-1 h-7 px-3 rounded-full border border-border-default bg-bg-control hover:bg-bg-control-hover text-[12px] text-neutral-700 cursor-pointer transition-colors"
                    >
                      {voiceGender}
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-none">
                  {filteredVoices.map(voice => {
                    const label = `${voice.name} - ${voice.tag}`
                    return (
                      <div key={voice.id} className="rounded-[10px]">
                        <VoiceRow
                          voice={voice}
                          compact
                          selected={label === voiceLabel}
                          playing={voicePlaying === voice.id}
                          onTogglePlay={() => setVoicePlaying(voicePlaying === voice.id ? null : voice.id)}
                          onSelect={() => setVoiceLabel(label)}
                        />
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
