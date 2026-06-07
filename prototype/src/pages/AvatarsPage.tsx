import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

/* ── Mock avatar library ──────────────────────────────────────────
   Each avatar has a paired voice. This is the source of truth —
   when an agent picks an avatar, its voice is overridden to match. */

export interface Avatar {
  id: string
  name: string
  role: string
  industry: 'Finance' | 'Healthcare' | 'Government' | 'Sales' | 'Support' | 'General'
  gender: 'Female' | 'Male'
  pairedVoice: string          // display name of the paired Cartesia voice
  pairedVoiceId: string        // voice ID
  emoji: string
  bgColor: string
  expressiveness: number       // 0–100
  style: 'Realistic' | 'Illustrated' | 'Abstract'
  isCustom?: boolean
}

export const AVATARS: Avatar[] = [
  {
    id: 'skylar',
    name: 'Skylar',
    role: 'Friendly Guide',
    industry: 'General',
    gender: 'Female',
    pairedVoice: 'Skylar - Friendly Guide',
    pairedVoiceId: 'e07c00bc-4134-4eae-9ea4-1a55fb45746b',
    emoji: '👩',
    bgColor: 'bg-green-100',
    expressiveness: 70,
    style: 'Realistic',
  },
  {
    id: 'nova',
    name: 'Nova',
    role: 'Financial Advisor',
    industry: 'Finance',
    gender: 'Female',
    pairedVoice: 'Nova - Professional',
    pairedVoiceId: 'nova-voice-id',
    emoji: '👩‍💼',
    bgColor: 'bg-blue-100',
    expressiveness: 50,
    style: 'Realistic',
  },
  {
    id: 'marcus',
    name: 'Marcus',
    role: 'Healthcare Coordinator',
    industry: 'Healthcare',
    gender: 'Male',
    pairedVoice: 'Marcus - Calm',
    pairedVoiceId: 'marcus-voice-id',
    emoji: '👨‍⚕️',
    bgColor: 'bg-teal-100',
    expressiveness: 55,
    style: 'Realistic',
  },
  {
    id: 'aria',
    name: 'Aria',
    role: 'Government Assistant',
    industry: 'Government',
    gender: 'Female',
    pairedVoice: 'Aria - Authoritative',
    pairedVoiceId: 'aria-voice-id',
    emoji: '👩‍💻',
    bgColor: 'bg-purple-100',
    expressiveness: 40,
    style: 'Realistic',
  },
  {
    id: 'james',
    name: 'James',
    role: 'Sales Representative',
    industry: 'Sales',
    gender: 'Male',
    pairedVoice: 'James - Energetic',
    pairedVoiceId: 'james-voice-id',
    emoji: '👨‍💼',
    bgColor: 'bg-orange-100',
    expressiveness: 85,
    style: 'Realistic',
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Customer Support',
    industry: 'Support',
    gender: 'Female',
    pairedVoice: 'Luna - Warm',
    pairedVoiceId: 'luna-voice-id',
    emoji: '👩‍🔬',
    bgColor: 'bg-pink-100',
    expressiveness: 65,
    style: 'Illustrated',
  },
]

type Industry = 'All' | Avatar['industry']
const INDUSTRIES: Industry[] = ['All', 'Finance', 'Healthcare', 'Government', 'Sales', 'Support', 'General']

function AvatarCard({ avatar, onSelect }: { avatar: Avatar; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group flex flex-col rounded-[10px] border border-neutral-300 bg-white hover:border-neutral-500 hover:shadow-sm transition-all cursor-pointer text-left overflow-hidden"
    >
      {/* Face area */}
      <div className={cn('w-full aspect-[4/3] flex items-center justify-center text-6xl', avatar.bgColor)}>
        {avatar.emoji}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-[600] text-neutral-900">{avatar.name}</span>
          {avatar.isCustom && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-[500]">Custom</span>
          )}
        </div>
        <span className="text-[11.5px] text-neutral-500 leading-4">{avatar.role}</span>
        <span className="text-[11px] text-neutral-400 leading-4">{avatar.pairedVoice}</span>
      </div>
    </button>
  )
}

export function AvatarsPage() {
  const [industry, setIndustry] = useState<Industry>('All')
  const navigate = useNavigate()

  const filtered = industry === 'All' ? AVATARS : AVATARS.filter(a => a.industry === industry)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[19px] font-[600] text-neutral-900 leading-7">Avatars</h3>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Each avatar is paired with a matching voice. Attach one to any agent.
          </p>
        </div>
        <button
          onClick={() => navigate('/avatars/new')}
          className="h-8 px-3 flex items-center gap-1.5 rounded-[7.2px] border border-neutral-400 bg-neutral-100 hover:bg-neutral-200 text-[12.8px] font-[500] text-neutral-900 cursor-pointer transition-colors"
        >
          <Plus size={14} strokeWidth={2} />
          New avatar
        </button>
      </div>

      {/* Industry filter */}
      <div className="flex gap-1.5 flex-wrap">
        {INDUSTRIES.map(ind => (
          <button
            key={ind}
            onClick={() => setIndustry(ind)}
            className={cn(
              'px-3 py-1 rounded-full text-[12px] font-[500] cursor-pointer transition-colors',
              industry === ind
                ? 'bg-brand text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Avatar grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map(avatar => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            onSelect={() => navigate(`/avatars/${avatar.id}`)}
          />
        ))}

        {/* Create your own card */}
        <button
          onClick={() => navigate('/avatars/new')}
          className="flex flex-col items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 aspect-[4/3] cursor-pointer transition-colors p-4"
          style={{ gridRow: 'span 1' }}
        >
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
            <Plus size={20} strokeWidth={1.5} className="text-neutral-500" />
          </div>
          <div className="text-center">
            <div className="text-[13px] font-[500] text-neutral-600">Create your own</div>
            <div className="text-[11.5px] text-neutral-400 mt-0.5">Upload a photo or illustration</div>
          </div>
        </button>
      </div>

      {/* Upload CTA */}
      <div className="flex items-center gap-4 p-4 rounded-[10px] border border-neutral-200 bg-neutral-50">
        <div className="w-10 h-10 rounded-full bg-brand-tint flex items-center justify-center shrink-0">
          <Upload size={18} strokeWidth={1.5} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-[500] text-neutral-900">Bring your own face</div>
          <div className="text-[12px] text-neutral-500 mt-0.5">
            Upload a photo or illustration — Cartesia animates it with lip-sync powered by your agent's voice.
          </div>
        </div>
        <button
          onClick={() => navigate('/avatars/new')}
          className="shrink-0 h-8 px-3 flex items-center gap-1.5 rounded-[7.2px] bg-brand text-white text-[12.8px] font-[500] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Sparkles size={14} strokeWidth={1.5} />
          Get started
        </button>
      </div>
    </div>
  )
}
