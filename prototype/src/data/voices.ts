/* ── Voice catalog ─────────────────────────────────────────────────
   Shared source of truth for the Voice Library page and the compact
   "Select a voice" picker modal. Both render the same voices; the modal
   simply hides the language/gender/Call columns. */

export interface Voice {
  id: string
  name: string
  tag: string
  desc: string
  flag: string
  language: string
  accent: string
  gender: 'Feminine' | 'Masculine'
  verified: boolean
  saved?: boolean
}

export const VOICES: Voice[] = [
  { id: 'v1',  name: 'Skylar',     tag: 'Friendly Guide',    desc: 'Approachable American female ideal for customer care and support.',          flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Feminine',  verified: true },
  { id: 'v2',  name: 'Corey',      tag: 'Supportive Buddy',  desc: 'Inviting, cheerful young adult male for casual conversation.',               flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Masculine', verified: true },
  { id: 'v3',  name: 'Gemma',      tag: 'Decisive Agent',    desc: 'Confident, emotive British female for professional assistance',              flag: '🇬🇧', language: 'English', accent: 'British',     gender: 'Feminine',  verified: true },
  { id: 'v4',  name: 'Archie',     tag: 'Approachable Mate', desc: 'Warm, conversational British male for casual and engaging dialogue.',        flag: '🇬🇧', language: 'English', accent: 'British',     gender: 'Masculine', verified: true },
  { id: 'v5',  name: 'Daniel',     tag: 'Modern Assistant',  desc: 'Clear, crisp male voice for digital assistants and system interactions',     flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Masculine', verified: true },
  { id: 'v6',  name: 'Katie',      tag: 'Friendly Fixer',    desc: 'Enunciating young adult female for conversational support use cases',         flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Feminine',  verified: true },
  { id: 'v7',  name: 'Jacqueline', tag: 'Reassuring Agent',  desc: 'Confident, young adult female for empathic customer support',                flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Feminine',  verified: true },
  { id: 'v8',  name: 'Ronald',     tag: 'Thinker',           desc: 'Intense, deep young adult male for casual conversations',                    flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Masculine', verified: true },
  { id: 'v9',  name: 'Ella',       tag: 'Caring Scout',      desc: 'Approachable presence for bright, lightweight and everyday customer conversations.', flag: '🇦🇺', language: 'English', accent: 'Australian', gender: 'Feminine', verified: true },
  { id: 'v10', name: 'Caroline',   tag: 'Southern Guide',    desc: 'Friendly, inviting, slow young adult female for conversation support',       flag: '🇺🇸', language: 'English', accent: 'Southern US', gender: 'Feminine',  verified: true },
  { id: 'v11', name: 'Blake',      tag: 'Helpful Agent',     desc: 'Energetic adult male for engaging customer support',                         flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Masculine', verified: true },
  { id: 'v12', name: 'Riya',       tag: 'College Roommate',  desc: 'Friendly woman for playful conversations',                                  flag: '🇮🇳', language: 'Hindi',   accent: '',            gender: 'Feminine',  verified: true, saved: true },
  { id: 'v13', name: 'Cathy',      tag: 'Coworker',          desc: 'Nice, young adult female for casual conversations.',                         flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Feminine',  verified: true },
]

export type VoiceTabKey = 'Featured' | 'All voices' | 'My voices' | 'Saved'
export const VOICE_TABS: VoiceTabKey[] = ['Featured', 'All voices', 'My voices', 'Saved']
export type GenderFilter = 'Any gender' | 'Feminine' | 'Masculine'

export function filterVoices(
  voices: Voice[],
  { search, gender, tab }: { search: string; gender: GenderFilter; tab: VoiceTabKey },
): Voice[] {
  return voices.filter(v => {
    const matchesSearch = (v.name + v.tag + v.desc).toLowerCase().includes(search.toLowerCase())
    const matchesGender = gender === 'Any gender' || v.gender === gender
    const matchesTab = tab === 'Saved' ? !!v.saved : true
    return matchesSearch && matchesGender && matchesTab
  })
}
