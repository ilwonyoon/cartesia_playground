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
import { Loader2, AlertCircle, Mic, MicOff } from 'lucide-react'

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
}: AnamPreviewProps) {
  const videoId = useId().replace(/:/g, '_')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError]   = useState('')
  const [greetingDone, setGreetingDone] = useState(false)
  const onGreetingDoneRef = useRef(onGreetingDone)
  onGreetingDoneRef.current = onGreetingDone
  const micOn = micEnabled

  useEffect(() => {
    if (!HAS_KEYS) return
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
          { disableInputAudio: !!greeting || !micEnabled }
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
  }, [greeting, stopAfterGreeting, micEnabled, avatarId, systemPrompt])

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

  const showCover = status === 'idle' || status === 'connecting' || greetingDone

  return (
    <div className={`relative overflow-hidden aspect-video ${className}`} style={{ backgroundImage: `url(${COVER})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <video id={videoId} autoPlay playsInline muted={outputMuted} className="absolute inset-0 w-full h-full object-cover" />

      {/* Cover image — shown while connecting and after greeting ends */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${showCover ? 'opacity-100' : 'opacity-0'}`}>
        <img src={COVER} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        {greeting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-[28px] leading-[1.2] tracking-[-0.4px] font-serif text-center drop-shadow-lg px-6">
              Add a face to<br />your agent
            </p>
          </div>
        )}
        {status === 'connecting' && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <Loader2 size={14} className="text-white/60 animate-spin" />
            <span className="text-white/50 text-[11px] font-[500]">Connecting…</span>
          </div>
        )}
      </div>

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertCircle size={22} className="text-red-400" />
          <p className="text-white/60 text-[13px]">{error}</p>
        </div>
      )}
      {status === 'live' && !greetingDone && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          {micOn ? <Mic size={12} className="text-brand-light" /> : <MicOff size={12} className="text-white/40" />}
          <span className="text-[11px] text-white/60 font-[500]">{micOn ? 'Mic on' : 'Mic off'}</span>
        </div>
      )}
    </div>
  )
}
