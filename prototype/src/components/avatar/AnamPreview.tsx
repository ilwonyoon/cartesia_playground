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
import { useEffect, useId, useState } from 'react'
import { Loader2, AlertCircle, Mic, MicOff } from 'lucide-react'

const API_KEY    = import.meta.env.VITE_ANAM_API_KEY    as string | undefined
const PERSONA_ID = import.meta.env.VITE_ANAM_PERSONA_ID as string | undefined
const HAS_KEYS   = !!(API_KEY && PERSONA_ID)

type Status = 'idle' | 'connecting' | 'live' | 'error'

interface AnamPreviewProps {
  micEnabled?: boolean
  /** Override which Anam avatar to stream. Falls back to VITE_ANAM_PERSONA_ID. */
  avatarId?: string
  systemPrompt?: string
  onReady?: (sendAudio: (pcmBase64: string) => void) => void
  className?: string
}

export function AnamPreview({
  micEnabled = true,
  avatarId,
  systemPrompt,
  onReady,
  className = '',
}: AnamPreviewProps) {
  const videoId = useId().replace(/:/g, '_')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError]   = useState('')
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
            personaId: PERSONA_ID!,
            name: '',
            avatarId: avatarId ?? '',
            voiceId: '',
            ...(systemPrompt ? { systemPrompt } : {}),
          },
          { disableInputAudio: !micEnabled }
        )

        if (cancelled) return
        await client.streamToVideoElement(videoId)
        if (cancelled) return

        setStatus('live')

        if (!micEnabled) {
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
  }, [micEnabled, avatarId, systemPrompt])

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

  return (
    <div className={`relative bg-neutral-900 overflow-hidden aspect-video ${className}`}>
      <video id={videoId} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
      {status === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="text-white/50 animate-spin" />
          <p className="text-white/40 text-[13px]">Connecting…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertCircle size={22} className="text-red-400" />
          <p className="text-white/60 text-[13px]">{error}</p>
        </div>
      )}
      {status === 'live' && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          {micOn ? <Mic size={12} className="text-brand-light" /> : <MicOff size={12} className="text-white/40" />}
          <span className="text-[11px] text-white/60 font-[500]">{micOn ? 'Mic on' : 'Mic off'}</span>
        </div>
      )}
    </div>
  )
}
