import { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { AnamPreview } from './AnamPreview'
import { VideoPreview } from './VideoPreview'
import { AvatarAnalysis } from './AvatarAnalysis'
import {
  AVATARS, getRecommendedFaces, sortByLivePreview, filterFaces, FACE_STYLES,
  previewGreeting,
  type Avatar,
} from '../../data/avatars'
import { VoiceRow } from '../voice/VoiceRow'
import { SearchField } from '../ui/SearchField'
import { FilterDropdown } from '../ui/FilterDropdown'
import {
  VOICES, VOICE_LANGUAGES, VOICE_ACCENTS, filterVoices,
  type GenderFilter,
} from '../../data/voices'

/* Filter options for the Face / Voice tabs — derived from the catalogs. */
const FACE_GENDER_OPTIONS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
]
const FACE_STYLE_OPTIONS = FACE_STYLES.map(s => ({ value: s, label: s }))
const VOICE_GENDER_OPTIONS = [
  { value: 'Feminine', label: 'Feminine' },
  { value: 'Masculine', label: 'Masculine' },
]
const VOICE_LANGUAGE_OPTIONS = VOICE_LANGUAGES.map(l => ({ value: l, label: l }))
const VOICE_ACCENT_OPTIONS = VOICE_ACCENTS.map(a => ({ value: a, label: a }))

/* The analysis scan plays once per page session — reopening lands on the
   result. sessionStorage survives HMR reloads (unlike module-level vars). */
const ANALYSIS_KEY = 'avatarAnalysisPlayed'
function hasPlayedAnalysis() { return sessionStorage.getItem(ANALYSIS_KEY) === '1' }
function markAnalysisPlayed() { sessionStorage.setItem(ANALYSIS_KEY, '1') }
export function resetAvatarAnalysis() { sessionStorage.removeItem(ANALYSIS_KEY) }

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

interface AvatarPickerModalProps {
  open: boolean
  onClose: () => void
  currentVoice: string
  selectedAvatarId?: string
  /** Confirm with the chosen face and the (possibly overridden) voice label. */
  onConfirm: (avatar: Avatar, voiceLabel: string) => void
  /** Agent's system prompt — passed through to the Anam live preview session. */
  systemPrompt?: string
  /** Agent's initial message — used as the greeting for the live preview. */
  initialMessage?: string
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

function AvatarCard({ avatar, active, recommended, showVoice, voiceLabel, roleOverride, onClick }: {
  avatar: Avatar; active: boolean; recommended: boolean; showVoice: boolean; voiceLabel: string; roleOverride?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-[12px] overflow-hidden border bg-bg-control text-left transition-all cursor-pointer',
        active ? 'border-2 border-brand' : 'border border-border-default hover:border-neutral-400',
      )}
    >
      <div className="relative w-full aspect-[4/5]">
        <FaceThumb avatar={avatar} className="absolute inset-0 w-full h-full" />
        {recommended && (
          <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-md bg-white/90 text-brand font-[600] shadow-sm">
            Recommended
          </span>
        )}
      </div>
      <div className="px-2.5 py-2 border-t border-border-default/60">
        <div className="text-[12.5px] font-[600] text-neutral-900 truncate leading-tight">{avatar.name}</div>
        <div className="text-[11.5px] text-neutral-900 truncate">{roleOverride ?? avatar.role}</div>
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

export function AvatarPickerModal({ open, onClose, currentVoice, selectedAvatarId, onConfirm, systemPrompt, initialMessage }: AvatarPickerModalProps) {
  const recommendedFaces = getRecommendedFaces()
  const recommended = recommendedFaces[0]
  const recommendedIds = new Set(recommendedFaces.map(a => a.id))

  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<Mode>('avatar')
  const [previewId, setPreviewId] = useState<string>(selectedAvatarId ?? recommended?.id ?? AVATARS[0].id)
  const [voiceLabel, setVoiceLabel] = useState<string>(currentVoice)
  // Avatar-tab "All avatars" controls — filter the full grid only; the
  // recommended three above stay a fixed curation.
  const [allSearch, setAllSearch] = useState('')
  const [allGender, setAllGender] = useState<string | null>(null)
  const [allStyle, setAllStyle] = useState<string | null>(null)
  // Face-tab controls (search + dropdown filters over all faces)
  const [faceSearch, setFaceSearch] = useState('')
  const [faceGender, setFaceGender] = useState<string | null>(null)
  const [faceStyle, setFaceStyle] = useState<string | null>(null)
  // Voice-tab controls
  const [voiceSearch, setVoiceSearch] = useState('')
  const [voiceGender, setVoiceGender] = useState<string | null>(null)
  const [voiceLanguage, setVoiceLanguage] = useState<string | null>(null)
  const [voiceAccent, setVoiceAccent] = useState<string | null>(null)
  const [voicePlaying, setVoicePlaying] = useState<string | null>(null)
  // First-open analysis scan (Avatar tab) — gated by the module flag.
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (!open) {
      requestAnimationFrame(() => setVisible(false))
      return
    }
    const seedId = selectedAvatarId ?? recommended?.id ?? AVATARS[0].id
    const raf = requestAnimationFrame(() => {
      setPreviewId(seedId)
      setVoiceLabel(currentVoice)
      setMode('avatar')
      if (!hasPlayedAnalysis()) setAnalyzing(true)
      requestAnimationFrame(() => setVisible(true))
    })
    return () => cancelAnimationFrame(raf)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onConfirm(previewAvatar, voiceLabel) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open && !visible) return null

  const previewAvatar = AVATARS.find(a => a.id === previewId) ?? AVATARS[0]

  // Recommended picks keep the agent's CURRENT voice (face-only swap); picking
  // from the full grid / Face tab adopts the face's own paired voice.
  function pickFace(a: Avatar, keepVoice: boolean) {
    setPreviewId(a.id)
    setVoiceLabel(keepVoice ? currentVoice : a.pairedVoice)
  }

  const recommendedId = recommended?.id
  // Avatar tab: curated 3 up top, then everything else (live faces first),
  // narrowed by the "All avatars" search + gender/style filters.
  const restAvatars = filterFaces(
    sortByLivePreview(AVATARS.filter(a => !recommendedIds.has(a.id))),
    { search: allSearch, gender: allGender, style: allStyle },
  )
  // Face tab: all faces through the search + dropdown filters.
  const filteredFaces = filterFaces(sortByLivePreview(AVATARS), {
    search: faceSearch, gender: faceGender, style: faceStyle,
  })
  const filteredVoices = filterVoices(VOICES, {
    search: voiceSearch,
    gender: (voiceGender ?? 'Any gender') as GenderFilter,
    tab: 'Featured',
    language: voiceLanguage,
    accent: voiceAccent,
  })
  const voiceObj = VOICES.find(v => `${v.name} - ${v.tag}` === voiceLabel)

  const MODES: { key: Mode; label: string }[] = [
    { key: 'avatar', label: 'Avatar' },
    { key: 'face', label: 'Face' },
    { key: 'voice', label: 'Voice' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        onClick={() => onConfirm(previewAvatar, voiceLabel)}
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
            onClick={() => onConfirm(previewAvatar, voiceLabel)}
            className="w-7 h-7 flex items-center justify-center rounded-[7px] hover:bg-neutral-200 text-neutral-600 cursor-pointer transition-colors"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">

          {/* Left — preview. Real Anam persona → live call (greeting + mic).
              No persona but a clip → local mp4. Otherwise a still. */}
          <div className="w-[52%] max-w-[500px] flex flex-col p-5 gap-4 border-r border-border-default shrink-0">
            {analyzing ? (
              /* Skeleton — whole left panel while analysis plays */
              <>
                <div className="rounded-[14px] aspect-video bg-neutral-200" />
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 h-[34px] rounded-control bg-neutral-200" />
                  <div className="flex-1 h-[34px] rounded-control bg-neutral-200" />
                </div>
                <div className="h-3 w-3/4 rounded bg-neutral-200" />
                <div className="mt-auto h-9 rounded-control bg-neutral-200" />
              </>
            ) : (
              <>
                <div className="rounded-[14px] overflow-hidden bg-neutral-900 shadow-sm">
                  {previewAvatar.anamPersonaId ? (
                    <AnamPreview
                      key={previewAvatar.id}
                      avatarId={previewAvatar.anamPersonaId}
                      greeting={initialMessage ?? previewGreeting(previewAvatar)}
                      systemPrompt={
                        systemPrompt
                          ? systemPrompt + (previewAvatar.systemPrompt ? `\n\n${previewAvatar.systemPrompt}` : '')
                          : previewAvatar.systemPrompt
                      }
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

                <div className="mt-auto">
                  <button
                    onClick={() => onConfirm(previewAvatar, voiceLabel)}
                    className="w-full h-9 rounded-control bg-brand text-white text-[13px] font-[500] hover:bg-brand-light cursor-pointer transition-colors"
                  >
                    Preview
                  </button>
                </div>
              </>
            )}
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

            {/* Avatar: first-open scan → recommended 3 + all avatars */}
            {mode === 'avatar' && (
              analyzing ? (
                <AvatarAnalysis
                  voiceName={voiceObj?.name ?? currentVoice}

                  onDone={() => { markAnalysisPlayed(); setAnalyzing(false) }}
                />
              ) : (
                <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 scrollbar-none">
                  {/* Recommended — curated picks that keep the agent's voice */}
                  <div className="flex items-baseline justify-between mb-2.5">
                    <h4 className="text-[13px] font-[600] text-neutral-900">Recommended for this agent</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {recommendedFaces.map(avatar => (
                      <AvatarCard
                        key={avatar.id}
                        avatar={avatar}
                        active={previewId === avatar.id}
                        recommended={avatar.id === recommendedId}
                        showVoice={false}
                        voiceLabel={currentVoice}
                        roleOverride={avatar.expressionStyle}
                        onClick={() => pickFace(avatar, true)}
                      />
                    ))}
                  </div>

                  {/* All avatars — full catalog; picking one adopts its paired
                      voice. Search + gender/style filter this grid only. */}
                  <div className="flex items-center gap-3 mt-5 mb-2.5">
                    <h4 className="text-[13px] font-[600] text-neutral-900 shrink-0">All avatars</h4>
                    <span className="flex-1 h-px bg-border-default/70" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <SearchField value={allSearch} onChange={setAllSearch} placeholder="Search avatars" shortcut={false} className="flex-1" />
                    <FilterDropdown anyLabel="Any gender" options={FACE_GENDER_OPTIONS} value={allGender} onChange={setAllGender} />
                    <FilterDropdown anyLabel="Any style" options={FACE_STYLE_OPTIONS} value={allStyle} onChange={setAllStyle} />
                  </div>
                  {restAvatars.length === 0 ? (
                    <p className="py-8 text-center text-[12.5px] text-neutral-500">No avatars match these filters.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {restAvatars.map(avatar => (
                        <AvatarCard
                          key={avatar.id}
                          avatar={avatar}
                          active={previewId === avatar.id}
                          recommended={false}
                          showVoice
                          voiceLabel={avatar.pairedVoice}
                          onClick={() => pickFace(avatar, false)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Face: search + dropdown filters (gender / style) over all faces */}
            {mode === 'face' && (
              <>
                <div className="px-4 pt-3 pb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <SearchField value={faceSearch} onChange={setFaceSearch} placeholder="Search faces" shortcut={false} className="flex-1" />
                    <FilterDropdown anyLabel="Any gender" options={FACE_GENDER_OPTIONS} value={faceGender} onChange={setFaceGender} />
                    <FilterDropdown anyLabel="Any style" options={FACE_STYLE_OPTIONS} value={faceStyle} onChange={setFaceStyle} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-none">
                  {filteredFaces.length === 0 ? (
                    <p className="pt-8 text-center text-[12.5px] text-neutral-500">No faces match these filters.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {filteredFaces.map(avatar => (
                        <AvatarCard
                          key={avatar.id}
                          avatar={avatar}
                          active={previewId === avatar.id}
                          recommended={recommendedIds.has(avatar.id)}
                          showVoice={false}
                          voiceLabel={avatar.pairedVoice}
                          onClick={() => pickFace(avatar, false)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Voice: search + dropdown filters (gender / language / accent) */}
            {mode === 'voice' && (
              <>
                <div className="px-4 pt-3 pb-2 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SearchField value={voiceSearch} onChange={setVoiceSearch} placeholder="Search voices" shortcut={false} className="flex-1 min-w-[160px]" />
                    <FilterDropdown anyLabel="Any gender" options={VOICE_GENDER_OPTIONS} value={voiceGender} onChange={setVoiceGender} />
                    <FilterDropdown anyLabel="Any language" options={VOICE_LANGUAGE_OPTIONS} value={voiceLanguage} onChange={setVoiceLanguage} />
                    <FilterDropdown anyLabel="Any accent" options={VOICE_ACCENT_OPTIONS} value={voiceAccent} onChange={setVoiceAccent} searchable />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-none">
                  {filteredVoices.length === 0 ? (
                    <p className="pt-8 text-center text-[12.5px] text-neutral-500">No voices match these filters.</p>
                  ) : filteredVoices.map(voice => {
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
