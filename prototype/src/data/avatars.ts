/* ── Avatar catalog ────────────────────────────────────────────────
   Shared source of truth for the Avatar Library page and the avatar
   picker modal. Each avatar is a face paired with a voice (and, for the
   live preview, an Anam persona + greeting/tone). Faces are grouped by
   JTBD industry; the one whose pairedVoice matches the agent's current
   voice is surfaced as "Recommended". */

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
  /* Face thumbnail for the grid/preview (Anam persona still). Falls back to
     the emoji chip when absent. */
  imageUrl?: string
  /* Looping preview clip for this face (Anam-exported mp4). When present the
     preview plays this locally instead of opening a live Anam session — same
     face as the thumbnail, no API cost. */
  videoUrl?: string
  /* Real Anam persona id, used if we ever stream live. Optional. */
  anamPersonaId?: string
  greeting?: string
  systemPrompt?: string
}

export const AVATARS: Avatar[] = [
  {
    id: 'skylar',
    name: 'Ava',
    role: 'Friendly Guide',
    industry: 'General',
    gender: 'Female',
    pairedVoice: 'Skylar - Friendly Guide',
    pairedVoiceId: 'v1',
    emoji: '👩',
    bgColor: 'bg-green-100',
    expressiveness: 70,
    style: 'Realistic',
    imageUrl: '/avatars/sophie_sofa.png',
    videoUrl: '/avatars/sophie_sofa.mp4',
    anamPersonaId: '271d9f52-40d5-4ec8-8bc8-368aa67e0026', // Liv
    greeting: "Hi, I'm Ava! I'm here to help you get started — what can I do for you?",
  },
  {
    id: 'nova',
    name: 'Priya',
    role: 'Financial Advisor',
    industry: 'Finance',
    gender: 'Female',
    pairedVoice: 'Gemma - Decisive Agent',
    pairedVoiceId: 'v3',
    emoji: '👩‍💼',
    bgColor: 'bg-blue-100',
    expressiveness: 50,
    style: 'Realistic',
    imageUrl: '/avatars/anne_home.png',
    videoUrl: '/avatars/anne_home.mp4',
    greeting: "Hello, I'm Priya. I can walk you through your accounts and options — where would you like to start?",
  },
  {
    id: 'marcus',
    name: 'Theo',
    role: 'Healthcare Coordinator',
    industry: 'Healthcare',
    gender: 'Male',
    pairedVoice: 'Daniel - Modern Assistant',
    pairedVoiceId: 'v5',
    emoji: '👨‍⚕️',
    bgColor: 'bg-teal-100',
    expressiveness: 55,
    style: 'Realistic',
    imageUrl: '/avatars/julia_sofa.png', // Bella persona's actual face
    videoUrl: '/avatars/julia_sofa.mp4',
    anamPersonaId: '7227cf25-c087-4f14-bcc9-8a1a4e193be8', // Bella (Patient Coordinator)
    greeting: "Hello, I'm Theo. I'm here to help with appointments and any questions before your visit.",
    systemPrompt: 'You are Theo, a healthcare coordinator. Be calm, caring, and professional. Keep responses to 2-3 sentences.',
  },
  {
    id: 'aria',
    name: 'Maya',
    role: 'Government Assistant',
    industry: 'Government',
    gender: 'Female',
    pairedVoice: 'Jacqueline - Reassuring Agent',
    pairedVoiceId: 'v7',
    emoji: '👩‍💻',
    bgColor: 'bg-purple-100',
    expressiveness: 40,
    style: 'Realistic',
    imageUrl: '/avatars/astrid_windowsofacorner.png',
    videoUrl: '/avatars/astrid_windowsofacorner.mp4',
    greeting: "Hello, I'm Maya. I can help you find the right form or service — what do you need today?",
  },
  {
    id: 'james',
    name: 'Leo',
    role: 'Sales Representative',
    industry: 'Sales',
    gender: 'Male',
    pairedVoice: 'Blake - Helpful Agent',
    pairedVoiceId: 'v11',
    emoji: '👨‍💼',
    bgColor: 'bg-orange-100',
    expressiveness: 85,
    style: 'Realistic',
    imageUrl: '/avatars/gabriel_table.png',
    videoUrl: '/avatars/gabriel_table.mp4',
    anamPersonaId: '000391fb-0093-48a8-8135-00eecd43e926', // Gabriel (Sales)
    greeting: "Hey, I'm Leo! Tell me what you're building and I'll be straight with you about the fit.",
    systemPrompt: 'You are Leo, a sales rep. Be enthusiastic, persuasive, and focused on value. Keep responses to 2-3 sentences.',
  },
  {
    id: 'luna',
    name: 'Ivy',
    role: 'Customer Support',
    industry: 'Support',
    gender: 'Female',
    pairedVoice: 'Katie - Friendly Fixer',
    pairedVoiceId: 'v6',
    emoji: '👩‍🔬',
    bgColor: 'bg-pink-100',
    expressiveness: 65,
    style: 'Illustrated',
    imageUrl: '/avatars/layla_home.png', // Mia persona's actual face
    videoUrl: '/avatars/layla_home.mp4',
    anamPersonaId: '05eb3c1f-50ee-42c5-accc-4606bfaa9276', // Mia (Customer Support)
    greeting: "Hi, I'm Ivy! Billing, a bug, or just getting started — I've got you. What can I help with?",
    systemPrompt: 'You are Ivy, a customer support agent. Be warm, empathetic, and efficient. Keep responses to 2-3 sentences.',
  },
]

export type Industry = 'All' | Avatar['industry']
export const INDUSTRIES: Industry[] = ['All', 'Finance', 'Healthcare', 'Government', 'Sales', 'Support', 'General']
/* Display order for grouped sections in the picker (no "All"). */
export const INDUSTRY_ORDER: Avatar['industry'][] = ['General', 'Finance', 'Healthcare', 'Government', 'Sales', 'Support']

/** Anam persona id for live preview, or undefined to use the env default. */
export function resolveAnamPersonaId(avatar: Avatar): string | undefined {
  return avatar.anamPersonaId
}

/** True when this avatar can play a moving preview — a local clip (videoUrl)
    or a live Anam persona. The clip always matches the thumbnail face. */
export function hasLivePreview(avatar: Avatar): boolean {
  return !!avatar.videoUrl || !!avatar.anamPersonaId
}

/** One line spoken on preview — authored greeting, or a generated fallback. */
export function previewGreeting(avatar: Avatar): string {
  return avatar.greeting ?? `Hi, I'm ${avatar.name}. ${avatar.role} here — how can I help?`
}

/* Faces recommended for the current agent — the system prompt + voice are
   already known, so we surface live-previewable faces that suit a friendly,
   general-purpose assistant. These keep the agent's CURRENT voice (only the
   face changes); their own pairedVoice is ignored in the Recommended tab.
   Curated by id, in priority order. */
const RECOMMENDED_FACE_IDS = ['skylar', 'luna', 'marcus'] // Ava, Ivy, Theo

/** The recommended faces (live-previewable), in curated order, max 3. */
export function getRecommendedFaces(): Avatar[] {
  return RECOMMENDED_FACE_IDS
    .map(id => AVATARS.find(a => a.id === id))
    .filter((a): a is Avatar => !!a && hasLivePreview(a))
    .slice(0, 3)
}

/** Order avatars so live-previewable faces come first (then by declaration). */
export function sortByLivePreview(avatars: Avatar[]): Avatar[] {
  return [...avatars].sort((a, b) => Number(hasLivePreview(b)) - Number(hasLivePreview(a)))
}
