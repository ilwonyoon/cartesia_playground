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
  /* Face thumbnail for the grid/preview (Anam persona image or static asset).
     Falls back to the emoji chip when absent. */
  imageUrl?: string
  /* Live-preview hooks. anamPersonaId is a real Anam persona; when absent,
     AnamPreview falls back to the env default persona (still previews). */
  anamPersonaId?: string
  greeting?: string
  systemPrompt?: string
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
    imageUrl: '/avatars/skylar.png',
    // No anamPersonaId → previews on the env default persona (the project's default face).
    greeting: "Hi, I'm Skylar! I'm here to help you get started — what can I do for you?",
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
    imageUrl: '/avatars/nova.png',
    greeting: "Hello, I'm Nova. I can walk you through your accounts and options — where would you like to start?",
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
    imageUrl: '/avatars/marcus.png',
    anamPersonaId: '7227cf25-c087-4f14-bcc9-8a1a4e193be8', // Bella (Patient Coordinator)
    greeting: "Hello, I'm Marcus. I'm here to help with appointments and any questions before your visit.",
    systemPrompt: 'You are Marcus, a healthcare coordinator. Be calm, caring, and professional. Keep responses to 2-3 sentences.',
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
    imageUrl: '/avatars/aria.png',
    greeting: "Hello, I'm Aria. I can help you find the right form or service — what do you need today?",
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
    imageUrl: '/avatars/james.png',
    anamPersonaId: '000391fb-0093-48a8-8135-00eecd43e926', // Gabriel (Sales)
    greeting: "Hey, I'm James! Tell me what you're building and I'll be straight with you about the fit.",
    systemPrompt: 'You are James, a sales rep. Be enthusiastic, persuasive, and focused on value. Keep responses to 2-3 sentences.',
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
    imageUrl: '/avatars/luna.png',
    anamPersonaId: '05eb3c1f-50ee-42c5-accc-4606bfaa9276', // Mia (Customer Support)
    greeting: "Hi, I'm Luna! Billing, a bug, or just getting started — I've got you. What can I help with?",
    systemPrompt: 'You are Luna, a customer support agent. Be warm, empathetic, and efficient. Keep responses to 2-3 sentences.',
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

/** One line spoken on preview — authored greeting, or a generated fallback. */
export function previewGreeting(avatar: Avatar): string {
  return avatar.greeting ?? `Hi, I'm ${avatar.name}. ${avatar.role} here — how can I help?`
}

/** The face whose paired voice matches the agent's current voice (keeps voice, just adds a face). */
export function getRecommendedAvatar(currentVoice: string): Avatar | undefined {
  return AVATARS.find(a => a.pairedVoice === currentVoice)
}

/** Split into the recommended face (if any) and the rest, in declaration order. */
export function partitionAvatars(currentVoice: string): { recommended: Avatar | undefined; rest: Avatar[] } {
  const recommended = getRecommendedAvatar(currentVoice)
  const rest = AVATARS.filter(a => a.id !== recommended?.id)
  return { recommended, rest }
}
