import { useRef, useState, useCallback, useEffect } from 'react'
import Cartesia from '@cartesia/cartesia-js'

const CARTESIA_API_KEY = import.meta.env.VITE_CARTESIA_API_KEY as string
const VOICE_ID = 'e07c00bc-4134-4eae-9ea4-1a55fb45746b'  // Skylar
const LINE_WS_URL = 'ws://localhost:8000/ws'
const MIC_SAMPLE_RATE = 16000

export type CallState = 'idle' | 'connecting' | 'active' | 'error'
export type TalkState = 'speaking' | 'listening'

export interface VoiceAgentState {
  callState: CallState
  talkState: TalkState
  agentAnalyser: AnalyserNode | null
  userAnalyser: AnalyserNode | null
  error: string | null
  startCall: () => Promise<void>
  endCall: () => void
  toggleMute: () => void
  muted: boolean
}

export function useVoiceAgent(): VoiceAgentState {
  const [callState, setCallState] = useState<CallState>('idle')
  const [talkState, setTalkState] = useState<TalkState>('listening')
  const [agentAnalyser, setAgentAnalyser] = useState<AnalyserNode | null>(null)
  const [userAnalyser, setUserAnalyser] = useState<AnalyserNode | null>(null)
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
  // Shared gain node — all TTS buffer sources connect here → analyser → destination
  const agentGainRef = useRef<GainNode | null>(null)
  const agentAnalyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => { mutedRef.current = muted }, [muted])

  const cleanup = useCallback(() => {
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
    agentGainRef.current = null
    agentAnalyserRef.current = null
    setAgentAnalyser(null)
    setUserAnalyser(null)
  }, [])

  const endCall = useCallback(() => {
    cleanup()
    setCallState('idle')
    setTalkState('listening')
    setMuted(false)
    setError(null)
  }, [cleanup])

  const startCall = useCallback(async () => {
    setCallState('connecting')
    setError(null)

    try {
      const cartesia = new Cartesia({ apiKey: CARTESIA_API_KEY })

      // 1. TTS WebSocket + AudioContext with AnalyserNode tap
      const ttsWs = await cartesia.tts.websocket()
      ttsWsRef.current = ttsWs
      const audioCtx = new AudioContext({ sampleRate: 24000 })
      audioCtxRef.current = audioCtx
      playbackTimeRef.current = audioCtx.currentTime

      // Single analyser that all TTS buffer sources feed through
      const agentGain = audioCtx.createGain()
      const agentNode = audioCtx.createAnalyser()
      agentNode.fftSize = 256
      agentNode.smoothingTimeConstant = 0.6
      agentGain.connect(agentNode)
      agentNode.connect(audioCtx.destination)
      agentGainRef.current = agentGain
      agentAnalyserRef.current = agentNode
      setAgentAnalyser(agentNode)

      // 2. Line agent WebSocket
      const lineWs = new WebSocket(LINE_WS_URL)
      lineWsRef.current = lineWs

      await new Promise<void>((resolve, reject) => {
        lineWs.onopen = () => {
          lineWs.send(JSON.stringify({
            call_id: `web-${Date.now()}`,
            from_: 'web',
            to: 'agent',
            agent: { id: null },
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
          setTalkState('speaking')
          void (async () => {
            try {
              const gen = ttsWs.generate({
                model_id: 'sonic-2',
                voice: { mode: 'id', id: VOICE_ID },
                transcript: msg.content!,
                output_format: { container: 'raw', encoding: 'pcm_s16le', sample_rate: 24000 },
              })
              for await (const chunk of gen) {
                if (chunk.type !== 'chunk' || !chunk.audio) continue
                const pcm16 = new Int16Array(chunk.audio.buffer, chunk.audio.byteOffset, chunk.audio.byteLength / 2)
                const float32 = new Float32Array(pcm16.length)
                for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768

                const buf = audioCtx.createBuffer(1, float32.length, 24000)
                buf.copyToChannel(float32, 0)
                const src = audioCtx.createBufferSource()
                src.buffer = buf
                // Route through shared gain → analyser → destination
                src.connect(agentGain)
                const startAt = Math.max(audioCtx.currentTime, playbackTimeRef.current)
                src.start(startAt)
                playbackTimeRef.current = startAt + buf.duration
              }
            } catch { /* non-fatal */ }
            setTalkState('listening')
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
              lineWs.send(JSON.stringify({ type: 'message', content: sttEvent.transcript }))
              lineWs.send(JSON.stringify({ type: 'user_state', value: 'idle' }))
            }
          }
        } catch { /* non-fatal */ }
      })()

      setCallState('active')

      // 4. Microphone → AnalyserNode + STT
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: MIC_SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      mediaStreamRef.current = stream

      const micCtx = new AudioContext({ sampleRate: MIC_SAMPLE_RATE })
      micCtxRef.current = micCtx
      const micSource = micCtx.createMediaStreamSource(stream)

      // AnalyserNode tap for visualization
      const userNode = micCtx.createAnalyser()
      userNode.fftSize = 256
      userNode.smoothingTimeConstant = 0.6
      micSource.connect(userNode)
      setUserAnalyser(userNode)

      // ScriptProcessorNode for sending PCM to STT
      const processor = micCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (mutedRef.current) return
        const float32 = e.inputBuffer.getChannelData(0)
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
  }, [cleanup, endCall])

  const toggleMute = useCallback(() => setMuted(v => !v), [])

  useEffect(() => () => cleanup(), [cleanup])

  return { callState, talkState, agentAnalyser, userAnalyser, error, startCall, endCall, toggleMute, muted }
}
