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
  /** Real Cartesia voice id (fetched from the live voice library) — lets
      prototypes speak with the actual voice, not a stand-in. */
  cartesiaId?: string
}

export const VOICES: Voice[] = [
  { id: 'v1',  name: 'Skylar',     tag: 'Friendly Guide',    desc: 'Approachable American female ideal for customer care and support.',          flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Feminine',  verified: true, cartesiaId: 'db6b0ed5-d5d3-463d-ae85-518a07d3c2b4' },
  { id: 'v2',  name: 'Corey',      tag: 'Supportive Buddy',  desc: 'Inviting, cheerful young adult male for casual conversation.',               flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Masculine', verified: true, cartesiaId: '630ed21c-2c5c-41cf-9d82-10a7fd668370' },
  { id: 'v3',  name: 'Gemma',      tag: 'Decisive Agent',    desc: 'Confident, emotive British female for professional assistance',              flag: '🇬🇧', language: 'English', accent: 'British',     gender: 'Feminine',  verified: true, cartesiaId: '62ae83ad-4f6a-430b-af41-a9bede9286ca' },
  { id: 'v4',  name: 'Archie',     tag: 'Approachable Mate', desc: 'Warm, conversational British male for casual and engaging dialogue.',        flag: '🇬🇧', language: 'English', accent: 'British',     gender: 'Masculine', verified: true, cartesiaId: 'ef191366-f52f-447a-a398-ed8c0f2943a1' },
  { id: 'v5',  name: 'Daniel',     tag: 'Modern Assistant',  desc: 'Clear, crisp male voice for digital assistants and system interactions',     flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Masculine', verified: true, cartesiaId: '47c38ca4-5f35-497b-b1a3-415245fb35e1' },
  { id: 'v6',  name: 'Katie',      tag: 'Friendly Fixer',    desc: 'Enunciating young adult female for conversational support use cases',         flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Feminine',  verified: true, cartesiaId: 'f786b574-daa5-4673-aa0c-cbe3e8534c02' },
  { id: 'v7',  name: 'Jacqueline', tag: 'Reassuring Agent',  desc: 'Confident, young adult female for empathic customer support',                flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Feminine',  verified: true, cartesiaId: '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc' },
  { id: 'v8',  name: 'Ronald',     tag: 'Thinker',           desc: 'Intense, deep young adult male for casual conversations',                    flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Masculine', verified: true, cartesiaId: '5ee9feff-1265-424a-9d7f-8e4d431a12c7' },
  { id: 'v9',  name: 'Ella',       tag: 'Caring Scout',      desc: 'Approachable presence for bright, lightweight and everyday customer conversations.', flag: '🇦🇺', language: 'English', accent: 'Australian', gender: 'Feminine', verified: true, cartesiaId: '2a12b36c-7f9b-4c3a-9f7a-72731b15323a' },
  { id: 'v10', name: 'Caroline',   tag: 'Southern Guide',    desc: 'Friendly, inviting, slow young adult female for conversation support',       flag: '🇺🇸', language: 'English', accent: 'Southern US', gender: 'Feminine',  verified: true, cartesiaId: 'f9836c6e-a0bd-460e-9d3c-f7299fa60f94' },
  { id: 'v11', name: 'Blake',      tag: 'Helpful Agent',     desc: 'Energetic adult male for engaging customer support',                         flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Masculine', verified: true, cartesiaId: 'a167e0f3-df7e-4d52-a9c3-f949145efdab' },
  { id: 'v12', name: 'Riya',       tag: 'College Roommate',  desc: 'Friendly woman for playful conversations',                                  flag: '🇮🇳', language: 'Hindi',   accent: '',            gender: 'Feminine',  verified: true, saved: true, cartesiaId: 'faf0731e-dfb9-4cfc-8119-259a79b27e12' },
  { id: 'v13', name: 'Cathy',      tag: 'Coworker',          desc: 'Nice, young adult female for casual conversations.',                         flag: '🇺🇸', language: 'English', accent: 'American',    gender: 'Feminine',  verified: true, cartesiaId: 'e8e5fffb-252c-436d-b842-8879b84445b6' },
]

export type VoiceTabKey = 'Featured' | 'All voices' | 'My voices' | 'Saved'
export const VOICE_TABS: VoiceTabKey[] = ['Featured', 'All voices', 'My voices', 'Saved']
export type GenderFilter = 'Any gender' | 'Feminine' | 'Masculine'

/** Distinct languages present in the catalog (for the Language filter). */
export const VOICE_LANGUAGES: string[] = [...new Set(VOICES.map(v => v.language))]
/** Distinct non-empty accents present in the catalog (for the Accent filter). */
export const VOICE_ACCENTS: string[] = [...new Set(VOICES.map(v => v.accent).filter(Boolean))]

export function filterVoices(
  voices: Voice[],
  { search, gender, tab, language = null, accent = null }: {
    search: string
    gender: GenderFilter
    tab: VoiceTabKey
    language?: string | null
    accent?: string | null
  },
): Voice[] {
  return voices.filter(v => {
    const matchesSearch = (v.name + v.tag + v.desc).toLowerCase().includes(search.toLowerCase())
    const matchesGender = gender === 'Any gender' || v.gender === gender
    const matchesTab = tab === 'Saved' ? !!v.saved : true
    const matchesLanguage = !language || v.language === language
    const matchesAccent = !accent || v.accent === accent
    return matchesSearch && matchesGender && matchesTab && matchesLanguage && matchesAccent
  })
}
