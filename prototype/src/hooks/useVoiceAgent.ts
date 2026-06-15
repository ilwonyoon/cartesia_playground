import { useRef, useState, useCallback, useEffect } from 'react'
import Cartesia from '@cartesia/cartesia-js'

const CARTESIA_API_KEY = import.meta.env.VITE_CARTESIA_API_KEY as string
const VOICE_ID = 'e07c00bc-4134-4eae-9ea4-1a55fb45746b'  // Skylar
const LINE_WS_URL = 'ws://localhost:8000/ws'
const MIC_SAMPLE_RATE = 16000

export type CallState = 'idle' | 'connecting' | 'active' | 'error'
export type TalkState = 'speaking' | 'listening'

export interface Message {
  role: 'agent' | 'user'
  content: string
  id: number
}

export interface VoiceAgentOptions {
  systemPrompt?: string
  initialMessage?: string
  /** Real Cartesia voice id — overrides the default preview voice (Skylar). */
  voiceId?: string
}

export interface VoiceAgentState {
  callState: CallState
  talkState: TalkState
  agentAmplitude: number
  userAmplitude: number
  messages: Message[]
  error: string | null
  startCall: () => Promise<void>
  endCall: () => void
  toggleMute: () => void
  muted: boolean
}

function pcmRms(float32: Float32Array): number {
  let sum = 0
  for (let i = 0; i < float32.length; i++) sum += float32[i] * float32[i]
  return Math.sqrt(sum / float32.length)
}

let _msgId = 0

export function useVoiceAgent({ systemPrompt, initialMessage, voiceId }: VoiceAgentOptions = {}): VoiceAgentState {
  const [callState, setCallState] = useState<CallState>('idle')
  const [talkState, setTalkState] = useState<TalkState>('listening')
  const [agentAmplitude, setAgentAmplitude] = useState(0)
  const [userAmplitude, setUserAmplitude] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lineWsRef = useRef<WebSocket | null>(null)
  const sttWsRef = useRef<ReturnType<InstanceType<typeof Cartesia>['stt']['autoFinalize']['websocket']> | null>(null)
  const ttsWsRef = useRef<Awaited<ReturnType<InstanceType<typeof Cartesia>['tts']['websocket']>> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const mutedRef = useRef(false)
  const playbackTimeRef = useRef(0)
  // setTimeout IDs for scheduled amplitude updates
  const ampTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => { mutedRef.current = muted }, [muted])

  const clearAmpTimeouts = useCallback(() => {
    ampTimeoutsRef.current.forEach(id => clearTimeout(id))
    ampTimeoutsRef.current = []
  }, [])

  const cleanup = useCallback(() => {
    clearAmpTimeouts()
    processorRef.current?.disconnect()
    processorRef.current = null
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    mediaStreamRef.current = null
    try { sttWsRef.current?.close() } catch { /* ignore */ }
    sttWsRef.current = null
    try { ttsWsRef.current?.close() } catch { /* ignore */ }
    ttsWsRef.current = null
    lineWsRef.current?.close()
    lineWsRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    micCtxRef.current?.close()
    micCtxRef.current = null
    setAgentAmplitude(0)
    setUserAmplitude(0)
  }, [clearAmpTimeouts])

  const endCall = useCallback(() => {
    cleanup()
    setCallState('idle')
    setTalkState('listening')
    setMuted(false)
    setError(null)
    setMessages([])
  }, [cleanup])

  const startCall = useCallback(async () => {
    setCallState('connecting')
    setError(null)

    try {
      const cartesia = new Cartesia({ apiKey: CARTESIA_API_KEY })

      // 1. TTS WebSocket + AudioContext
      const ttsWs = await cartesia.tts.websocket()
      ttsWsRef.current = ttsWs
      const audioCtx = new AudioContext({ sampleRate: 24000 })
      audioCtxRef.current = audioCtx
      if (audioCtx.state === 'suspended') await audioCtx.resume()
      playbackTimeRef.current = audioCtx.currentTime

      // 2. Line agent WebSocket
      const lineWs = new WebSocket(LINE_WS_URL)
      lineWsRef.current = lineWs

      await new Promise<void>((resolve, reject) => {
        lineWs.onopen = () => {
          lineWs.send(JSON.stringify({
            call_id: `web-${Date.now()}`,
            from_: 'web',
            to: 'agent',
            agent: {
              id: null,
              ...(systemPrompt ? { system_prompt: systemPrompt } : {}),
              ...(initialMessage ? { introduction: initialMessage } : {}),
            },
            metadata: {},
          }))
          resolve()
        }
        lineWs.onerror = () => reject(new Error('Line server connection failed'))
        lineWs.onclose = () => reject(new Error('Line server closed immediately'))
      })

      lineWs.onerror = () => { setError('Connection error'); setCallState('error'); cleanup() }
      lineWs.onclose = () => { endCall() }

      lineWs.onmessage = (e) => {
        if (typeof e.data !== 'string') return
        let msg: { type: string; content?: string }
        try { msg = JSON.parse(e.data) } catch { return }

        if (msg.type === 'message' && msg.content) {
          const capturedContent = msg.content!
          const capturedId = ++_msgId
          setTalkState('speaking')
          void (async () => {
            try {
              const gen = ttsWs.generate({
                model_id: 'sonic-2',
                voice: { mode: 'id', id: voiceId ?? VOICE_ID },
                transcript: capturedContent,
                output_format: { container: 'raw', encoding: 'pcm_s16le', sample_rate: 24000 },
              })

              let messageAdded = false
              for await (const chunk of gen) {
                if (chunk.type !== 'chunk' || !chunk.audio) continue

                const pcm16 = new Int16Array(chunk.audio.buffer, chunk.audio.byteOffset, chunk.audio.byteLength / 2)
                const float32 = new Float32Array(pcm16.length)
                for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768

                // Schedule amplitude update to fire when this chunk starts playing
                const rms = pcmRms(float32)
                const amp = Math.min(1, rms * 12)
                const startAt = Math.max(audioCtx.currentTime, playbackTimeRef.current)
                const delayMs = Math.max(0, (startAt - audioCtx.currentTime) * 1000)
                const id = setTimeout(() => setAgentAmplitude(amp), delayMs)
                ampTimeoutsRef.current.push(id)

                // Add chat message timed to when audio actually starts playing
                if (!messageAdded) {
                  messageAdded = true
                  const msgId2 = setTimeout(
                    () => setMessages(prev => [...prev, { role: 'agent', content: capturedContent, id: capturedId }]),
                    delayMs,
                  )
                  ampTimeoutsRef.current.push(msgId2)
                }

                const buf = audioCtx.createBuffer(1, float32.length, 24000)
                buf.copyToChannel(float32, 0)
                const src = audioCtx.createBufferSource()
                src.buffer = buf
                src.connect(audioCtx.destination)
                src.start(startAt)
                playbackTimeRef.current = startAt + buf.duration
              }
            } catch { /* non-fatal */ }
            setTalkState('listening')
            setAgentAmplitude(0)
          })()
        }

        if (msg.type === 'end_call') endCall()
      }

      // 3. STT WebSocket
      const sttWs = cartesia.stt.autoFinalize.websocket({
        model: 'ink-2',
        encoding: 'pcm_s16le',
        sample_rate: MIC_SAMPLE_RATE,
      })
      sttWsRef.current = sttWs

      void (async () => {
        try {
          for await (const event of sttWs) {
            if (event.type !== 'message') continue
            const sttEvent = event.message
            if (lineWs.readyState !== WebSocket.OPEN) continue
            if (sttEvent.type === 'turn.start') {
              lineWs.send(JSON.stringify({ type: 'user_state', value: 'speaking' }))
            } else if (sttEvent.type === 'turn.end' && sttEvent.transcript) {
              setMessages(prev => [...prev, { role: 'user', content: sttEvent.transcript, id: ++_msgId }])
              lineWs.send(JSON.stringify({ type: 'message', content: sttEvent.transcript }))
              lineWs.send(JSON.stringify({ type: 'user_state', value: 'idle' }))
            }
          }
        } catch { /* non-fatal */ }
      })()

      // 4. Microphone — request before going active so a denial aborts cleanly
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { sampleRate: MIC_SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true },
        })
      } catch {
        throw new Error('Microphone access denied. Allow microphone in your browser settings and try again.')
      }

      setCallState('active')
      mediaStreamRef.current = stream!

      const micCtx = new AudioContext({ sampleRate: MIC_SAMPLE_RATE })
      micCtxRef.current = micCtx
      if (micCtx.state === 'suspended') await micCtx.resume()
      const micSource = micCtx.createMediaStreamSource(stream!)

      const processor = micCtx.createScriptProcessor(2048, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0)
        // Update user amplitude regardless of mute (visual feedback)
        const amp = Math.min(1, pcmRms(float32) * 12)
        setUserAmplitude(amp)

        if (mutedRef.current) return
        const pcm16 = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768))
        }
        sttWs.sendRaw(pcm16.buffer)
      }

      micSource.connect(processor)
      processor.connect(micCtx.destination)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setCallState('error')
      cleanup()
    }
  }, [cleanup, endCall, clearAmpTimeouts, systemPrompt, initialMessage, voiceId])

  const toggleMute = useCallback(() => setMuted(v => !v), [])

  // Decay both amplitudes toward 0 each frame — smooth release
  useEffect(() => {
    const id = setInterval(() => {
      setAgentAmplitude(v => v > 0.01 ? v * 0.80 : 0)
      setUserAmplitude(v => v > 0.01 ? v * 0.80 : 0)
    }, 40)
    return () => clearInterval(id)
  }, [])

  const cleanupRef = useRef(cleanup)
  useEffect(() => { cleanupRef.current = cleanup }, [cleanup])
  useEffect(() => () => cleanupRef.current(), [])

  return { callState, talkState, agentAmplitude, userAmplitude, messages, error, startCall, endCall, toggleMute, muted }
}
