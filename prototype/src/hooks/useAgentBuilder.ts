import { useRef, useState, useCallback, useEffect } from 'react'
import Cartesia from '@cartesia/cartesia-js'
import { askBuilder, type BrainTurn } from '../lib/builderBrain'
import { resolveStage, EMPTY_VERIFY_SIGNALS, type BuilderStage, type VerifySignals } from '../lib/builderPlaybook'
import { applyPatch, EMPTY_DRAFT, type AgentDraft, type DraftPatch } from '../lib/agentDraft'

/* ── useAgentBuilder ───────────────────────────────────────────────
   The voice loop behind the conversational agent builder:

     mic ──► Ink-2 STT (native turn detection) ──► Claude (design_agent
     tool: say + draft patch) ──► Sonic-3 TTS playback ──► mic …

   Half-duplex by design: mic frames only reach STT while we're in the
   'listening' turn state, so the builder never transcribes itself.
   Modeled on useVoiceAgent (the phone-preview loop), with the local
   Line server swapped for the Claude brain + draft state. */

const CARTESIA_API_KEY = import.meta.env.VITE_CARTESIA_API_KEY as string | undefined
const BUILDER_VOICE_ID = 'e07c00bc-4134-4eae-9ea4-1a55fb45746b' // Skylar — the builder's own voice
const MIC_SAMPLE_RATE = 16000
const TTS_SAMPLE_RATE = 24000

export const BUILDER_GREETING =
  "Hi — I design voice agents. Tell me who it'll talk to and what it should get done, and I'll draft it while we talk."

export type SessionState = 'idle' | 'connecting' | 'live' | 'error'
export type TurnState = 'listening' | 'thinking' | 'speaking'

export interface BuilderMessage {
  id: number
  role: 'builder' | 'you'
  content: string
}

export interface AgentBuilderOptions {
  /** Fired with each draft patch the brain produces — lets a host surface
      (e.g. the real configuration form) apply changes as they happen. */
  onPatch?: (patch: DraftPatch) => void
  /** While true, mic audio is not forwarded to STT (e.g. when the builder
      panel is hidden behind another preview tab). */
  paused?: boolean
  /** Existing agent config to load as the session's starting draft — turns
      the builder from a creator into an editor. */
  initialDraft?: AgentDraft | null
  /** Spoken+shown opening line; defaults to the creation greeting. */
  greeting?: string
  /** What the console knows about verification — sim runs, breaks, open
      deviations. Drives the playbook stage; the brain never guesses. */
  verifySignals?: VerifySignals
}

export interface AgentBuilderState {
  sessionState: SessionState
  turnState: TurnState
  messages: BuilderMessage[]
  /** Live partial transcript of the user's in-progress turn. */
  partial: string
  /** Tap-able quick replies for the builder's latest question. */
  choices: string[]
  draft: AgentDraft
  done: boolean
  error: string | null
  micAvailable: boolean
  /** False in a text session — no TTS, no mic; the UI should drop voice-flavored copy. */
  voiceEnabled: boolean
  /** Playbook stage — draft (first draft in progress), verify (test & fix), ship (all green). */
  stage: BuilderStage
  inputLevel: number
  start: (opts?: { voice?: boolean }) => Promise<void>
  end: () => void
  sendText: (text: string) => void
  /** Upgrade a live text session to voice — spins up TTS + mic/STT in place. */
  enableVoice: () => Promise<void>
}

function pcmRms(float32: Float32Array): number {
  let sum = 0
  for (let i = 0; i < float32.length; i++) sum += float32[i] * float32[i]
  return Math.sqrt(sum / float32.length)
}

let _msgId = 0

export function useAgentBuilder({ onPatch, paused = false, initialDraft = null, greeting, verifySignals = EMPTY_VERIFY_SIGNALS }: AgentBuilderOptions = {}): AgentBuilderState {
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [turnState, setTurnState] = useState<TurnState>('listening')
  const [messages, setMessages] = useState<BuilderMessage[]>([])
  const [partial, setPartial] = useState('')
  const [choices, setChoices] = useState<string[]>([])
  const [draft, setDraft] = useState<AgentDraft>(EMPTY_DRAFT)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [micAvailable, setMicAvailable] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [inputLevel, setInputLevel] = useState(0)

  const sttWsRef = useRef<ReturnType<InstanceType<typeof Cartesia>['stt']['autoFinalize']['websocket']> | null>(null)
  const ttsWsRef = useRef<Awaited<ReturnType<InstanceType<typeof Cartesia>['tts']['websocket']>> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const playbackTimeRef = useRef(0)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  // Live mirrors so the STT iterator / mic callback always read fresh values
  const turnRef = useRef<TurnState>('listening')
  const sessionRef = useRef<SessionState>('idle')
  const draftRef = useRef<AgentDraft>(EMPTY_DRAFT)
  const historyRef = useRef<BrainTurn[]>([])
  const onPatchRef = useRef<AgentBuilderOptions['onPatch']>(onPatch)
  const pausedRef = useRef(paused)
  const initialDraftRef = useRef<AgentDraft | null>(initialDraft)
  const greetingRef = useRef<string | undefined>(greeting)
  const doneRef = useRef(false)
  const verifySignalsRef = useRef<VerifySignals>(verifySignals)
  /** Chat-first: sessions can run without voice — no mic, no TTS. */
  const voiceEnabledRef = useRef(true)

  useEffect(() => { turnRef.current = turnState }, [turnState])
  useEffect(() => { sessionRef.current = sessionState }, [sessionState])
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { onPatchRef.current = onPatch }, [onPatch])
  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { initialDraftRef.current = initialDraft }, [initialDraft])
  useEffect(() => { greetingRef.current = greeting }, [greeting])
  useEffect(() => { doneRef.current = done }, [done])
  useEffect(() => { verifySignalsRef.current = verifySignals }, [verifySignals])

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id))
    timeoutsRef.current = []
  }, [])

  const cleanup = useCallback(() => {
    clearTimeouts()
    processorRef.current?.disconnect()
    processorRef.current = null
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    mediaStreamRef.current = null
    try { sttWsRef.current?.close() } catch { /* already closed */ }
    sttWsRef.current = null
    try { ttsWsRef.current?.close() } catch { /* already closed */ }
    ttsWsRef.current = null
    void audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    void micCtxRef.current?.close().catch(() => {})
    micCtxRef.current = null
    setInputLevel(0)
  }, [clearTimeouts])

  const end = useCallback(() => {
    cleanup()
    setSessionState('idle')
    setTurnState('listening')
    setMessages([])
    setPartial('')
    setChoices([])
    setDraft(EMPTY_DRAFT)
    setDone(false)
    setError(null)
    setMicAvailable(true)
    setVoiceEnabled(true)
    voiceEnabledRef.current = true
    historyRef.current = []
  }, [cleanup])

  /** Speak a line through Sonic-3, then hand the turn back to the user.
      In text mode the line is shown, not spoken — the turn flips straight
      back to listening. */
  const speak = useCallback(async (text: string) => {
    if (!voiceEnabledRef.current) {
      setTurnState('listening')
      turnRef.current = 'listening'
      return
    }
    const ttsWs = ttsWsRef.current
    const ctx = audioCtxRef.current
    if (!ttsWs || !ctx) return
    setTurnState('speaking')
    turnRef.current = 'speaking'
    try {
      const gen = ttsWs.generate({
        model_id: 'sonic-3',
        voice: { mode: 'id', id: BUILDER_VOICE_ID },
        transcript: text,
        output_format: { container: 'raw', encoding: 'pcm_s16le', sample_rate: TTS_SAMPLE_RATE },
      })
      playbackTimeRef.current = Math.max(playbackTimeRef.current, ctx.currentTime)
      for await (const chunk of gen) {
        if (chunk.type !== 'chunk' || !chunk.audio) continue
        const pcm16 = new Int16Array(chunk.audio.buffer, chunk.audio.byteOffset, chunk.audio.byteLength / 2)
        const float32 = new Float32Array(pcm16.length)
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768
        const buf = ctx.createBuffer(1, float32.length, TTS_SAMPLE_RATE)
        buf.copyToChannel(float32, 0)
        const src = ctx.createBufferSource()
        src.buffer = buf
        src.connect(ctx.destination)
        const startAt = Math.max(ctx.currentTime, playbackTimeRef.current)
        src.start(startAt)
        playbackTimeRef.current = startAt + buf.duration
      }
    } catch (err) {
      console.error('TTS playback failed:', err)
    }
    // Flip back to listening only once the scheduled audio has finished playing.
    const remainingMs = Math.max(0, (playbackTimeRef.current - ctx.currentTime) * 1000)
    const id = setTimeout(() => {
      if (sessionRef.current === 'live') {
        setTurnState('listening')
        turnRef.current = 'listening'
      }
    }, remainingMs + 150)
    timeoutsRef.current.push(id)
  }, [])

  /** One full exchange: user text → brain → draft patch → spoken reply. */
  const handleUserTurn = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sessionRef.current !== 'live' || turnRef.current !== 'listening') return

    setPartial('')
    setChoices([])
    setMessages(prev => [...prev, { id: ++_msgId, role: 'you', content: trimmed }])
    historyRef.current = [...historyRef.current, { role: 'user', content: trimmed }]
    setTurnState('thinking')
    turnRef.current = 'thinking'

    try {
      const stage = resolveStage({
        editing: initialDraftRef.current !== null,
        done: doneRef.current,
        signals: verifySignalsRef.current,
      })
      const result = await askBuilder(historyRef.current, draftRef.current, { stage, signals: verifySignalsRef.current })
      if (sessionRef.current !== 'live') return
      setError(null)
      historyRef.current = [...historyRef.current, { role: 'assistant', content: result.say }]
      setDraft(prev => applyPatch(prev, result.patch))
      onPatchRef.current?.(result.patch)
      if (result.done) setDone(true)
      setMessages(prev => [...prev, { id: ++_msgId, role: 'builder', content: result.say }])
      setChoices(result.choices)
      await speak(result.say)
    } catch (err) {
      console.error('Builder turn failed:', err)
      if (sessionRef.current !== 'live') return
      setError(err instanceof Error ? err.message : 'The builder hit an error — try again.')
      setTurnState('listening')
      turnRef.current = 'listening'
    }
  }, [speak])

  const sendText = useCallback((text: string) => {
    void handleUserTurn(text)
  }, [handleUserTurn])

  /** All audio plumbing — TTS playback, mic, Ink-2 STT. Shared by a voice
      start() and a mid-session text→voice upgrade. */
  const setupVoice = useCallback(async (cartesia: InstanceType<typeof Cartesia>) => {
    // 1. TTS websocket + playback context
    const ttsWs = await cartesia.tts.websocket()
    ttsWsRef.current = ttsWs
    const audioCtx = new AudioContext({ sampleRate: TTS_SAMPLE_RATE })
    audioCtxRef.current = audioCtx
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    playbackTimeRef.current = audioCtx.currentTime

    // 2. Microphone — denial degrades to typed input with spoken replies
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: MIC_SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      setMicAvailable(true)
    } catch {
      setMicAvailable(false)
    }

    // 3. Ink-2 STT websocket with native turn detection
    if (stream) {
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
            if (turnRef.current !== 'listening' || sessionRef.current !== 'live' || pausedRef.current) continue
            if (sttEvent.type === 'turn.update' && sttEvent.transcript) {
              setPartial(sttEvent.transcript)
            } else if (sttEvent.type === 'turn.end') {
              const transcript = sttEvent.transcript?.trim()
              setPartial('')
              if (transcript) void handleUserTurn(transcript)
            }
          }
        } catch (err) {
          if (sessionRef.current === 'live') console.error('STT stream ended:', err)
        }
      })()

      mediaStreamRef.current = stream
      const micCtx = new AudioContext({ sampleRate: MIC_SAMPLE_RATE })
      micCtxRef.current = micCtx
      if (micCtx.state === 'suspended') await micCtx.resume()
      const micSource = micCtx.createMediaStreamSource(stream)
      const processor = micCtx.createScriptProcessor(2048, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0)
        setInputLevel(Math.min(1, pcmRms(float32) * 12))
        // Half-duplex gate: never feed the builder its own voice (or anything
        // it shouldn't hear while another preview tab is active)
        if (turnRef.current !== 'listening' || pausedRef.current) return
        const pcm16 = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768))
        }
        sttWs.sendRaw(pcm16.buffer)
      }

      micSource.connect(processor)
      processor.connect(micCtx.destination)
    }
  }, [handleUserTurn])

  const start = useCallback(async ({ voice = true }: { voice?: boolean } = {}) => {
    if (sessionRef.current === 'live' || sessionRef.current === 'connecting') return
    setSessionState('connecting')
    sessionRef.current = 'connecting'
    setError(null)
    voiceEnabledRef.current = voice
    setVoiceEnabled(voice)

    try {
      // Text mode needs no audio plumbing at all — the brain is the session.
      if (voice && !CARTESIA_API_KEY) {
        throw new Error('Missing VITE_CARTESIA_API_KEY — add it to prototype/.env.local to enable voice.')
      }
      if (voice && CARTESIA_API_KEY) {
        await setupVoice(new Cartesia({ apiKey: CARTESIA_API_KEY }))
      } else {
        setMicAvailable(false)
      }

      setSessionState('live')
      sessionRef.current = 'live'
      // Editing an existing agent: its live config becomes the session draft,
      // so the brain patches instead of starting over.
      if (initialDraftRef.current) {
        setDraft(initialDraftRef.current)
        draftRef.current = initialDraftRef.current
      }
      const hello = greetingRef.current ?? BUILDER_GREETING
      setMessages([{ id: ++_msgId, role: 'builder', content: hello }])
      void speak(hello)
    } catch (err) {
      console.error('Builder session failed to start:', err)
      setError(err instanceof Error ? err.message : 'Failed to start the builder session.')
      setSessionState('error')
      sessionRef.current = 'error'
      cleanup()
    }
  }, [cleanup, setupVoice, speak])

  /** Text session → voice, in place: the conversation and draft stay,
      TTS speaks from the next turn, the mic starts listening now. */
  const enableVoice = useCallback(async () => {
    if (voiceEnabledRef.current || sessionRef.current !== 'live') return
    if (!CARTESIA_API_KEY) {
      setError('Missing VITE_CARTESIA_API_KEY — add it to prototype/.env.local to enable voice.')
      return
    }
    try {
      await setupVoice(new Cartesia({ apiKey: CARTESIA_API_KEY }))
      voiceEnabledRef.current = true
      setVoiceEnabled(true)
      setError(null)
    } catch (err) {
      console.error('Voice upgrade failed:', err)
      setError(err instanceof Error ? err.message : 'Could not enable voice.')
    }
  }, [setupVoice])

  // Smooth mic level release
  useEffect(() => {
    const id = setInterval(() => {
      setInputLevel(v => (v > 0.01 ? v * 0.8 : 0))
    }, 40)
    return () => clearInterval(id)
  }, [])

  const cleanupRef = useRef(cleanup)
  useEffect(() => { cleanupRef.current = cleanup }, [cleanup])
  useEffect(() => () => cleanupRef.current(), [])

  const stage = resolveStage({ editing: initialDraft !== null, done, signals: verifySignals })

  return {
    sessionState, turnState, messages, partial, choices, draft, done, error,
    micAvailable, voiceEnabled, stage, inputLevel, start, end, sendText, enableVoice,
  }
}
