import { useState, useRef } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { GlassPill } from '../ui/GlassPill'

/* ── VideoPreview ──────────────────────────────────────────────────
   Plays a local avatar clip (Anam-exported mp4) on demand. Shows the
   poster still with a Play button until the user starts it — no autoplay,
   no streaming cost. The clip is the same face as the poster, so what you
   preview always matches the card. While playing, a status strip (bottom)
   mirrors the live-call HUD: a "Live preview" pill on the left and a
   pause / replay control on the right. */

interface VideoPreviewProps {
  posterUrl?: string
  videoUrl: string
}

export function VideoPreview({ posterUrl, videoUrl }: VideoPreviewProps) {
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function start() {
    setStarted(true)
    setPaused(false)
    requestAnimationFrame(() => { videoRef.current?.play().catch(() => {}) })
  }

  function togglePause() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}); setPaused(false) }
    else { v.pause(); setPaused(true) }
  }

  function replay() {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play().catch(() => {})
    setPaused(false)
  }

  return (
    <div className="relative aspect-video bg-neutral-900">
      {started ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            loop
            playsInline
            muted
            autoPlay
            onPause={() => setPaused(true)}
            onPlay={() => setPaused(false)}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Status HUD — left: live-preview pill, right: pause / replay */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 pointer-events-none bg-gradient-to-t from-black/40 to-transparent">
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
              <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-white/40' : 'bg-brand-light animate-pulse'}`} />
              <span className="text-[11px] text-white/80 font-[500]">{paused ? 'Paused' : 'Live preview'}</span>
            </span>
            <span className="flex items-center gap-1 pointer-events-auto">
              <button
                onClick={togglePause}
                aria-label={paused ? 'Play' : 'Pause'}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/55 text-white/80 cursor-pointer transition-colors"
              >
                {paused ? <Play size={13} className="fill-current translate-x-px" /> : <Pause size={13} className="fill-current" />}
              </button>
              <button
                onClick={replay}
                aria-label="Replay"
                className="w-7 h-7 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/55 text-white/80 cursor-pointer transition-colors"
              >
                <RotateCcw size={13} />
              </button>
            </span>
          </div>
        </>
      ) : (
        <>
          {posterUrl
            ? <img src={posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0 bg-neutral-900" />}
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GlassPill onClick={start} aria-label="Play preview" className="h-10 pl-4 pr-5">
              <Play size={15} className="fill-black/70 text-black/70" />
              <span className="text-[13px] font-[600] text-black/70">Play preview</span>
            </GlassPill>
          </div>
        </>
      )}
    </div>
  )
}
