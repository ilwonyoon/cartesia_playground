import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
import { cn } from '../lib/utils'
import { AVATARS, INDUSTRIES, type Avatar, type Industry } from '../data/avatars'

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

/* ── Upload Avatar tab ── */
function UploadAvatarTab() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) setFile(f)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-[19px] font-[600] text-neutral-900 leading-7">Upload Avatar</h3>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          Upload a photo or illustration — Cartesia animates it with real-time lip-sync.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-[12px] border-2 border-dashed p-12 transition-colors cursor-pointer',
          dragging ? 'border-brand bg-brand-tint' : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100'
        )}
      >
        {file ? (
          <>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand">
              <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <div className="text-[13px] font-[500] text-neutral-900">{file.name}</div>
              <button onClick={() => setFile(null)} className="text-[12px] text-neutral-400 hover:text-neutral-600 cursor-pointer mt-1">Remove</button>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
              <Upload size={22} strokeWidth={1.5} className="text-neutral-500" />
            </div>
            <div className="text-center">
              <div className="text-[13.5px] font-[500] text-neutral-700">Drop an image here</div>
              <div className="text-[12px] text-neutral-400 mt-1">PNG, JPG, WEBP — max 10MB</div>
            </div>
            <label className="h-8 px-4 flex items-center gap-1.5 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover text-[12.8px] font-[500] text-neutral-900 cursor-pointer transition-colors">
              <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
              Browse files
            </label>
          </>
        )}
      </div>

      {/* Requirements */}
      <div className="flex flex-col gap-2 p-4 rounded-[10px] bg-neutral-50 border border-neutral-200">
        <div className="text-[12.5px] font-[500] text-neutral-700">For best results</div>
        <ul className="flex flex-col gap-1">
          {['Clear view of the face, front-facing', 'Good lighting, neutral background', 'Photo or realistic illustration'].map(tip => (
            <li key={tip} className="flex items-center gap-2 text-[12px] text-neutral-500">
              <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {file && (
        <button className="h-9 w-full rounded-[7.2px] bg-brand text-white text-[13px] font-[500] hover:opacity-90 cursor-pointer transition-opacity">
          Create avatar →
        </button>
      )}
    </div>
  )
}

export function AvatarsPage({ initialTab }: { initialTab?: 'library' | 'upload' }) {
  const [industry, setIndustry] = useState<Industry>('All')
  const tab = initialTab ?? 'library'
  const navigate = useNavigate()

  const filtered = industry === 'All' ? AVATARS : AVATARS.filter(a => a.industry === industry)

  if (tab === 'upload') return <UploadAvatarTab />

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[19px] font-[600] text-neutral-900 leading-7">Avatar Library</h3>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Each avatar is paired with a matching voice. Attach one to any agent.
          </p>
        </div>
        <button
          onClick={() => navigate('/avatars/upload')}
          className="h-8 px-3 flex items-center gap-1.5 rounded-control border border-border-default bg-bg-control hover:bg-bg-control-hover text-[12.8px] font-[500] text-neutral-900 cursor-pointer transition-colors"
        >
          <Plus size={14} strokeWidth={2} />
          Upload avatar
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

        {/* Upload card */}
        <button
          onClick={() => navigate('/avatars/upload')}
          className="flex flex-col items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 aspect-[4/3] cursor-pointer transition-colors p-4"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
            <Plus size={20} strokeWidth={1.5} className="text-neutral-500" />
          </div>
          <div className="text-center">
            <div className="text-[13px] font-[500] text-neutral-600">Upload your own</div>
            <div className="text-[11.5px] text-neutral-400 mt-0.5">Photo or illustration</div>
          </div>
        </button>
      </div>
    </div>
  )
}
