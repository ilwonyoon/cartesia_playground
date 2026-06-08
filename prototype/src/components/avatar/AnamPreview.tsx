/**
 * AnamPreview — real Anam avatar.
 * - micEnabled: true = user mic drives conversation (default)
 * - avatarId: override which avatar to render (defaults to VITE_ANAM_PERSONA_ID)
 * - systemPrompt: override persona behavior
 * - onReady: called with sendAudio() for audio passthrough mode
 *
 * ⚠️  unsafe_createClientWithApiKey exposes the key in the browser.
 *     Local prototyping only — production uses server-minted session tokens.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, AlertCircle, Mic, MicOff, Play, Square } from 'lucide-react'
import { GlassPill } from '../ui/GlassPill'

const API_KEY    = import.meta.env.VITE_ANAM_API_KEY    as string | undefined
const PERSONA_ID = import.meta.env.VITE_ANAM_PERSONA_ID as string | undefined
const HAS_KEYS   = !!(API_KEY && PERSONA_ID)

type Status = 'idle' | 'connecting' | 'live' | 'error'

interface AnamPreviewProps {
  /** Speak this line once after connecting. */
  greeting?: string
  /** If true, stop streaming after greeting ends. Default false (keep session alive). */
  stopAfterGreeting?: boolean
  /** Called when greeting finishes (endOfSpeech). */
  onGreetingDone?: () => void
  micEnabled?: boolean
  /** Mute the avatar's audio output (video element muted). Default false. */
  outputMuted?: boolean
  /** Override which Anam avatar to stream. Falls back to VITE_ANAM_PERSONA_ID. */
  avatarId?: string
  systemPrompt?: string
  onReady?: (sendAudio: (pcmBase64: string) => void) => void
  className?: string
  /** Onboarding cover ("Add a face to your agent"). Default true. Set false
      in pickers where the live video should stand alone. */
  showCoverArt?: boolean
  /** Don't auto-connect on mount — show a poster + Play button and only start
      streaming when the user clicks. Saves Anam session cost. Default false. */
  manualStart?: boolean
  /** Still poster shown before streaming (face thumbnail) in manualStart mode. */
  posterUrl?: string
}

const COVER = '/cartesia_cover.webp'

export function AnamPreview({
  greeting,
  stopAfterGreeting = false,
  onGreetingDone,
  micEnabled = true,
  outputMuted = false,
  avatarId,
  systemPrompt,
  onReady,
  className = '',
  showCoverArt = true,
  manualStart = false,
  posterUrl,
}: AnamPreviewProps) {
  const videoId = useId().replace(/:/g, '_')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError]   = useState('')
  const [greetingDone, setGreetingDone] = useState(false)
  // In manualStart mode, streaming only begins once the user presses Play.
  const [armed, setArmed] = useState(!manualStart)
  const onGreetingDoneRef = useRef(onGreetingDone)
  onGreetingDoneRef.current = onGreetingDone
  const micOn = micEnabled

  useEffect(() => {
    if (!HAS_KEYS || !armed) return
    let cancelled = false
    let client: any = null

    async function start() {
      setStatus('connecting')
      try {
        const { unsafe_createClientWithApiKey } = await import('@anam-ai/js-sdk')

        client = unsafe_createClientWithApiKey(
          API_KEY!,
          {
            personaId: avatarId ?? PERSONA_ID!,
            name: '',
            avatarId: '',
            voiceId: '',
            ...(systemPrompt ? { systemPrompt } : {}),
          },
          // Mic drives the call when enabled — even with an opening greeting,
          // so the user can speak back. Only disable input when mic is off.
          { disableInputAudio: !micEnabled }
        )

        if (cancelled) return
        await client.streamToVideoElement(videoId)
        if (cancelled) return

        setStatus('live')

        if (greeting) {
          // Wait for VIDEO_PLAY_STARTED before talking — talk() requires active streaming.
          const { AnamEvent } = await import('@anam-ai/js-sdk')
          client.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, (e: { endOfSpeech: boolean }) => {
            if (e.endOfSpeech && !cancelled) {
              setGreetingDone(true)
              onGreetingDoneRef.current?.()
              if (stopAfterGreeting) client?.stopStreaming?.().catch(() => {})
            }
          })
          client.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
            client?.talk(greeting).catch((err: unknown) => console.error('[AnamPreview] talk() failed:', err))
          })
        } else if (!micEnabled) {
          const stream = client.createAgentAudioInputStream({
            encoding: 'pcm_s16le',
            sampleRate: 16000,
            channels: 1,
          })
          onReady?.((b64: string) => stream.sendAudioChunk(b64))
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus('error')
          setError(e?.message ?? 'Anam connection failed')
        }
      }
    }

    start()
    return () => {
      cancelled = true
      client?.stopStreaming?.().catch(() => {})
    }
  }, [armed, greeting, stopAfterGreeting, micEnabled, avatarId, systemPrompt])

  if (!HAS_KEYS) {
    return (
      <div className={`relative bg-neutral-900 overflow-hidden flex items-center justify-center aspect-video ${className}`}>
        <div className="flex flex-col items-center gap-2.5 text-center px-6">
          <p className="text-white/60 text-[13px] font-[500]">Anam live avatar</p>
          <p className="text-white/35 text-[12px] leading-relaxed">
            Set <code className="font-mono text-brand-light">VITE_ANAM_API_KEY</code> and{' '}
            <code className="font-mono text-brand-light">VITE_ANAM_PERSONA_ID</code>{' '}
            in <code className="font-mono text-white/50">prototype/.env.local</code>
          </p>
        </div>
      </div>
    )
  }

  // With cover art on: also reveal the cover after greeting ends (onboarding feel).
  // With cover art off (pickers): only cover while idle/connecting; keep live video after greeting.
  const showCover = status === 'idle' || status === 'connecting' || (showCoverArt && greetingDone)

  return (
    <div className={`relative overflow-hidden aspect-video ${className}`} style={showCoverArt ? { backgroundImage: `url(${COVER})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#1c1b1a' }}>
      <video id={videoId} autoPlay playsInline muted={outputMuted} className="absolute inset-0 w-full h-full object-cover" />

      {/* Cover / connecting state */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${showCover ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {showCoverArt ? (
          <>
            <img src={COVER} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            {greeting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-[28px] leading-[1.2] tracking-[-0.4px] font-serif text-center drop-shadow-lg px-6">
                  Add a face to<br />your agent
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
        {status === 'connecting' && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <Loader2 size={14} className="text-white/60 animate-spin" />
            <span className="text-white/50 text-[11px] font-[500]">Connecting…</span>
          </div>
        )}
      </div>

      {/* Manual-start poster — still image + Preview button, no stream until clicked */}
      {manualStart && !armed && (
        <div className="absolute inset-0">
          {posterUrl
            ? <img src={posterUrl} alt="" className="w-full h-full object-cover" />
            : <div className="absolute inset-0 bg-neutral-900" />}
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GlassPill onClick={() => setArmed(true)} aria-label="Play" className="h-10 pl-4 pr-5">
              <Play size={15} className="fill-black/70 text-black/70" />
              <span className="text-[13px] font-[600] text-black/70">Play</span>
            </GlassPill>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertCircle size={22} className="text-red-400" />
          <p className="text-white/60 text-[13px]">{error}</p>
        </div>
      )}
      {/* Live HUD — left: Live + Stop, right: mic state */}
      {status === 'live' && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 bg-gradient-to-t from-black/40 to-transparent">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-light animate-pulse" />
              <span className="text-[11px] text-white/80 font-[500]">Live</span>
            </span>
            <button
              onClick={() => { setArmed(false); setStatus('idle'); setGreetingDone(false) }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 cursor-pointer transition-colors"
            >
              <Square size={10} className="fill-white/70 text-white/70" />
              <span className="text-[11px] text-white/80 font-[500]">Stop</span>
            </button>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 pointer-events-none">
            {micOn ? <Mic size={12} className="text-brand-light" /> : <MicOff size={12} className="text-white/40" />}
            <span className="text-[11px] text-white/80 font-[500]">{micOn ? 'Mic on' : 'Mic off'}</span>
          </span>
        </div>
      )}
    </div>
  )
}
