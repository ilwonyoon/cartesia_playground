/* ── Content store ─────────────────────────────────────────────────
   The runtime half of the UX-writing system: a locale switch and a
   per-key value-override layer (both localStorage-backed), consumed
   through useContent()/t(). Keys are the stable contract — swap the
   value (in one locale or all) and every surface updates live.

   Model (benchmarked on Lokalise/Ditto): copy lives in a typed
   catalog (./entries) with writer-facing metadata; this store only
   handles locale + overrides + interpolation. AI-generated speech
   (the builder's `say`) is conversational content, not product copy,
   and deliberately lives outside this system. */

import { useSyncExternalStore } from 'react'
import { CONTENT_BY_KEY, type ContentKey } from './entries'

export type Locale = 'en' | 'ko'
export const LOCALES: Locale[] = ['en', 'ko']

interface ContentState {
  locale: Locale
  /** Editor overrides layered over the catalog, per key per locale. */
  overrides: Partial<Record<ContentKey, Partial<Record<Locale, string>>>>
}

const STORAGE_KEY = 'cartesia-proto-content-v1'

function load(): ContentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ContentState>
      return {
        locale: parsed.locale === 'ko' ? 'ko' : 'en',
        overrides: parsed.overrides ?? {},
      }
    }
  } catch (err) {
    console.error('Content store load failed:', err)
  }
  return { locale: 'en', overrides: {} }
}

let state: ContentState = load()
const listeners = new Set<() => void>()

function commit(next: ContentState) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (err) {
    console.error('Content store save failed:', err)
  }
  listeners.forEach(l => l())
}

export function setLocale(locale: Locale): void {
  commit({ ...state, locale })
}

export function setOverride(key: ContentKey, locale: Locale, value: string): void {
  const base = CONTENT_BY_KEY[key]?.value[locale]
  const forKey = { ...(state.overrides[key] ?? {}) }
  if (value === base || value === '') {
    delete forKey[locale]
  } else {
    forKey[locale] = value
  }
  const overrides = { ...state.overrides }
  if (Object.keys(forKey).length === 0) {
    delete overrides[key]
  } else {
    overrides[key] = forKey
  }
  commit({ ...state, overrides })
}

export function clearOverrides(): void {
  commit({ ...state, overrides: {} })
}

/** Resolved value for a key in a locale: override → catalog → en → key. */
export function resolve(key: ContentKey, locale: Locale): string {
  const entry = CONTENT_BY_KEY[key]
  const override = state.overrides[key]?.[locale]
  if (override !== undefined) return override
  const value = entry?.value[locale]
  if (value !== undefined) return value
  const enOverride = state.overrides[key]?.en
  if (enOverride !== undefined) return enOverride
  return entry?.value.en ?? key
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in vars ? String(vars[name]) : m)
}

export type Translate = (key: ContentKey, vars?: Record<string, string | number>) => string

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Reactive translate function bound to the current locale. */
export function useContent(): Translate {
  const snapshot = useSyncExternalStore(subscribe, () => state)
  return (key, vars) => interpolate(resolve(key, snapshot.locale), vars)
}

/** Reactive full state — for the management page. */
export function useContentState(): ContentState {
  return useSyncExternalStore(subscribe, () => state)
}
