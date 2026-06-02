import { useState } from 'react'
import { Play, Square } from 'lucide-react'
import { IconTextToSpeech, IconSpeechToText, IconDocumentation, IconApiKeys } from '../components/icons'

const GET_STARTED = [
  {
    icon: <IconTextToSpeech size={20} className="text-brand" />,
    label: 'Try Sonic',
    desc: 'Generate realistic speech from text',
  },
  {
    icon: <IconSpeechToText size={20} className="text-brand" />,
    label: 'Try Ink',
    desc: 'Realtime transcription',
  },
  {
    icon: <IconDocumentation size={20} className="text-brand" />,
    label: 'Read the docs',
    desc: 'Guides and API reference',
  },
  {
    icon: <IconApiKeys size={20} className="text-brand" />,
    label: 'Get API key',
    desc: 'Authenticate your requests to the API',
  },
]

const VOICES = [
  { name: 'Skylar', tag: 'Friendly Guide', flag: '🇺🇸', desc: 'Approachable American female ideal for customer care and support.', verified: true },
  { name: 'Corey', tag: 'Supportive Buddy', flag: '🇺🇸', desc: 'Inviting, cheerful young adult male for casual conversation.', verified: true },
  { name: 'Gemma', tag: 'Decisive Agent', flag: '🇬🇧', desc: 'Confident, emotive British female for professional assistance.', verified: true },
  { name: 'Archie', tag: 'Approachable Mate', flag: '🇬🇧', desc: 'Warm, conversational British male for casual and engaging dialogue.', verified: true },
  { name: 'Daniel', tag: 'Modern Assistant', flag: '🇺🇸', desc: 'Clear, crisp male voice for digital assistants and system interactions.', verified: true },
  { name: 'Katie', tag: 'Friendly Fixer', flag: '🇺🇸', desc: 'Enunciating young adult female for conversational support use cases.', verified: true },
]

export function WelcomePage() {
  const [playing, setPlaying] = useState<string | null>(null)

  return (
    /* Figma: Container 896x852, pLeft:16 pRight:16, gap:24 */
    <div className="flex flex-col gap-6 px-4">

      {/* Title block — gap:4 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-[500] text-neutral-900 font-serif leading-8">
          Welcome to Cartesia
        </h1>
        {/* Figma: fs=14.8/400 #737373 */}
        <p className="text-[14.8px] font-[400] text-neutral-500 leading-6">
          The developer platform for AI voice
        </p>
      </div>

      {/* Separator — Figma: 864x1 fill=#0a0a0a */}
      <div className="h-px bg-neutral-900/10" />

      {/* Get started — Figma: Margin pTop:16 pBottom:32, gap:24 */}
      <div className="flex flex-col gap-6 pb-8">
        {/* Heading 2: fs=16.9/500 */}
        <h2 className="text-[16.9px] font-[500] text-neutral-900 leading-7">Get started</h2>

        {/* 4 links — Figma: Container pTop:16 pBottom:16 gap:24, each Link 144x104 gap:8 */}
        {/* Figma: Container 864x136 pTop:16 pBottom:16 gap:24, each Link 144x104 gap:8 */}
        <div className="flex justify-center gap-6 pt-4 pb-4">
          {GET_STARTED.map(({ icon, label, desc }) => (
            <button
              key={label}
              className="w-[144px] flex-shrink-0 flex flex-col items-center gap-2 text-center cursor-pointer"
            >
              {/* Icon — 24x24 */}
              <div className="w-6 h-6 flex items-center justify-center">
                {icon}
              </div>
              {/* Label + chevron — align:CENTER */}
              <div className="flex items-center gap-0.5">
                <span className="text-[14.9px] font-[500] text-neutral-900 leading-6">{label}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-neutral-400 flex-shrink-0">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {/* Description — 두 줄, 40px height, pLeft/pRight padding, align:CENTER */}
              <p className="text-[13.2px] font-[400] text-neutral-500 leading-5 w-full">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Featured voices — Figma: gap:16 */}
      <div className="flex flex-col gap-4">
        {/* Header row — Figma: gap:622 (space-between) */}
        <div className="flex items-center justify-between">
          {/* Heading 2: fs=17/500 */}
          <h2 className="text-[17px] font-[500] text-neutral-900 leading-7">Featured voices</h2>
          {/* Button: fs=13.1/500 pLeft:10 pRight:10 */}
          <button className="text-[13.1px] font-[500] text-neutral-900 px-2.5 py-1 rounded-[6px] hover:bg-neutral-200 transition-colors cursor-pointer">
            View all voices
          </button>
        </div>

        {/* Voice list — Figma: each Margin py:8, inner Container px:8 py:8 gap:16 */}
        <div>
          {VOICES.map((voice, i) => (
            <div
              key={voice.name}
              className={`flex items-center gap-4 px-2 py-2 rounded-[6px] hover:bg-neutral-200/60 transition-colors ${i > 0 ? 'border-t border-neutral-400' : ''}`}
            >
              {/* Play button — Figma: 40x40 fill=#dbe6d0, pLeft:13 pRight:11 */}
              <button
                onClick={() => setPlaying(playing === voice.name ? null : voice.name)}
                className="w-10 h-10 rounded-full bg-brand-tint flex items-center justify-center flex-shrink-0 hover:bg-brand/20 transition-colors cursor-pointer"
              >
                {playing === voice.name
                  ? <Square size={12} className="text-brand fill-brand" />
                  : <Play size={12} className="text-brand fill-brand translate-x-px" />
                }
              </button>

              {/* Name + desc — flex-1 */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-[600] text-neutral-900">{voice.name}</span>
                  <span className="text-[14px] font-[400] text-neutral-500">- {voice.tag}</span>
                  <span className="text-sm">{voice.flag}</span>
                  {voice.verified && (
                    <span className="w-3.5 h-3.5 rounded-full bg-brand flex items-center justify-center text-white text-[9px] leading-none">✓</span>
                  )}
                </div>
                <p className="text-[13px] text-neutral-500 truncate">{voice.desc}</p>
              </div>

              {/* Use button — Figma: 41x32 pLeft:8 pRight:8 pTop:4 pBottom:4, fs=12/500 */}
              <button className="text-[12px] font-[500] text-neutral-900 px-2 py-1 rounded-[6px] hover:bg-neutral-200 transition-colors cursor-pointer flex-shrink-0">
                Use
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
