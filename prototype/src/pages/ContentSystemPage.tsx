import { useEffect, useMemo, useState } from 'react'
import { Pencil, X, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { SearchField } from '../components/ui/SearchField'
import { Badge } from '../components/ui/Badge'
import { CONTENT, CONTENT_BY_KEY, SURFACES, KINDS, type ContentEntry, type Surface, type Kind } from '../content/entries'
import { useContentState, setLocale, setOverride, clearOverrides, resolve, LOCALES, type Locale } from '../content/store'

/* ── UX writing system ─────────────────────────────────────────────
   The management surface for product copy. Built to scale past two
   locales: the LIST shows only the source language (English) per key;
   clicking a row opens a Notion-style side panel where every locale
   for that key is managed — the Lokalise list + key-editor model.

   Research grounding: Lokalise/Locize semantic keys, Ditto's
   text-as-components, context notes as the highest-leverage metadata,
   per-locale coverage stats. */

const LOCALE_LABEL: Record<Locale, string> = { en: 'EN', ko: 'KO' }
const LOCALE_NAME: Record<Locale, string> = { en: 'English', ko: '한국어 · Korean' }
const SOURCE_LOCALE: Locale = 'en'

function isMissing(entry: ContentEntry, locale: Locale, overrides: ReturnType<typeof useContentState>['overrides']): boolean {
  return entry.value[locale] === undefined && overrides[entry.key]?.[locale] === undefined
}

function EditableValue({ entry, locale, large }: { entry: ContentEntry; locale: Locale; large?: boolean }) {
  const state = useContentState()
  const override = state.overrides[entry.key]?.[locale]
  const base = entry.value[locale]
  const shown = override ?? base ?? ''
  const missing = base === undefined && override === undefined
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function begin() {
    setDraft(shown)
    setEditing(true)
  }
  function commit() {
    setEditing(false)
    if (draft !== shown) setOverride(entry.key, locale, draft)
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
          if (e.key === 'Escape') { e.stopPropagation(); setEditing(false) }
        }}
        rows={Math.min(6, Math.max(large ? 2 : 1, Math.ceil(draft.length / 44)))}
        className="w-full resize-none rounded-[6px] border border-neutral-600 bg-white px-2.5 py-2 text-[12.5px] leading-[1.5] text-neutral-900 outline-none"
      />
    )
  }

  return (
    <button
      onClick={begin}
      className="group w-full text-left rounded-[6px] px-2.5 py-2 -mx-1 hover:bg-neutral-200/60 transition-colors cursor-text"
    >
      <span className="flex items-start gap-1.5">
        <span className={cn(
          'flex-1 min-w-0 leading-[1.5] whitespace-pre-wrap',
          large ? 'text-[13px]' : 'text-[12.5px]',
          missing ? 'text-neutral-400 italic' : 'text-neutral-900',
        )}>
          {missing ? `(falls back to EN) ${resolve(entry.key, 'en')}` : shown}
        </span>
        <Pencil size={11} strokeWidth={1.7} className="mt-1 shrink-0 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      <span className="flex items-center gap-1 mt-1 empty:hidden">
        {override !== undefined && <Badge size="sm">Edited</Badge>}
        {missing && <Badge tone="neutral" size="sm">Missing</Badge>}
      </span>
    </button>
  )
}

/* Notion-style detail panel — one key, every locale. */
function KeyDetailPanel({ entryKey, onClose }: { entryKey: string; onClose: () => void }) {
  const state = useContentState()
  const entry = CONTENT_BY_KEY[entryKey]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!entry) return null
  const otherLocales = LOCALES.filter(l => l !== SOURCE_LOCALE)
  const covered = otherLocales.filter(l => !isMissing(entry, l, state.overrides)).length

  return (
    <aside className="fixed inset-0 md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-[440px] z-40 bg-white border-l border-neutral-400 shadow-[-12px_0_32px_rgba(0,0,0,0.08)] flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-5 pt-4 pb-3 border-b border-neutral-300 flex items-start gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <p className="font-mono text-[12.5px] text-neutral-900 leading-[1.4] break-all">{entry.key}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge tone="neutral" size="sm">{entry.surface}</Badge>
            <Badge tone="neutral" size="sm">{entry.kind}</Badge>
            {state.overrides[entry.key] && <Badge size="sm">Edited</Badge>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-neutral-200 text-neutral-600 cursor-pointer shrink-0"
        >
          <X size={15} strokeWidth={1.7} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {/* Context — the writer-facing note */}
        {entry.context && (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wide">Context</p>
            <p className="text-[12.5px] text-neutral-700 leading-[1.55]">{entry.context}</p>
          </div>
        )}

        {/* Source language */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wide">{LOCALE_NAME[SOURCE_LOCALE]}</p>
            <Badge size="sm">Source</Badge>
          </div>
          <div className="rounded-[8px] border border-neutral-400 bg-bg-control px-1.5 py-0.5">
            <EditableValue entry={entry} locale={SOURCE_LOCALE} large />
          </div>
        </div>

        {/* All other locales — this list is the part that scales to 50 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wide">Locales</p>
            <Badge tone="neutral" size="sm">{covered}/{otherLocales.length} translated</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {otherLocales.map(locale => (
              <div key={locale} className="rounded-[8px] border border-neutral-400 bg-white overflow-hidden">
                <div className="px-3 py-1.5 border-b border-neutral-200 bg-neutral-100 flex items-center gap-2">
                  <span className="font-mono text-[10.5px] font-[600] text-neutral-600 uppercase">{locale}</span>
                  <span className="text-[11.5px] text-neutral-500">{LOCALE_NAME[locale]}</span>
                  {isMissing(entry, locale, state.overrides) && <Badge tone="neutral" size="sm" className="ml-auto">Missing</Badge>}
                </div>
                <div className="px-1.5 py-0.5">
                  <EditableValue entry={entry} locale={locale} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

export function ContentSystemPage() {
  const state = useContentState()
  const [search, setSearch] = useState('')
  const [surface, setSurface] = useState<Surface | 'all'>('all')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return CONTENT.filter(e =>
      (surface === 'all' || e.surface === surface) &&
      (kind === 'all' || e.kind === kind) &&
      (q === '' ||
        e.key.toLowerCase().includes(q) ||
        e.value.en.toLowerCase().includes(q) ||
        (e.value.ko ?? '').toLowerCase().includes(q) ||
        (e.context ?? '').toLowerCase().includes(q)),
    )
  }, [search, surface, kind])

  const otherLocales = LOCALES.filter(l => l !== SOURCE_LOCALE)
  const koCovered = CONTENT.filter(e => !isMissing(e, 'ko', state.overrides)).length
  const editedCount = Object.keys(state.overrides).length

  const selectCls = 'h-8 px-2.5 rounded-control border border-border-default bg-bg-control text-[12.5px] font-[500] text-neutral-700 hover:bg-bg-control-hover cursor-pointer outline-none'

  return (
    <div className="flex flex-col gap-5 pb-16 pt-8 px-4 md:px-10 max-w-[1240px] w-full mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1.5 max-w-[560px]">
          <h1 className="text-[24px] font-[500] text-neutral-900 leading-[32px] font-serif">UX writing</h1>
          <p className="text-[13px] text-neutral-500 leading-[1.55]">
            Every string in the product is a key — <span className="font-mono text-[12px]">surface.component.element</span> —
            with per-locale values, a context note, and a taxonomy. The list shows the source language;
            open a key to manage every locale in its panel.
          </p>
        </div>

        {/* Locale switch — flips the whole app */}
        <div className="flex items-center p-0.5 rounded-[7.2px] bg-neutral-300">
          {LOCALES.map(l => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={cn(
                'h-[26px] px-3.5 rounded-[5.76px] text-[12.5px] font-[600] leading-5 cursor-pointer transition-colors',
                state.locale === l ? 'bg-neutral-100 text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
              )}
            >
              {LOCALE_LABEL[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge tone="neutral" size="sm">{CONTENT.length} keys</Badge>
        <Badge tone="neutral" size="sm">{otherLocales.length + 1} locales</Badge>
        <Badge tone="neutral" size="sm">ko coverage {Math.round((koCovered / CONTENT.length) * 100)}%</Badge>
        {editedCount > 0 && (
          <>
            <Badge size="sm">{editedCount} edited</Badge>
            <button
              onClick={clearOverrides}
              className="text-[11.5px] font-[500] text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
            >
              Reset edits
            </button>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <SearchField value={search} onChange={setSearch} placeholder="Search keys, values, context…" />
        </div>
        <select value={surface} onChange={e => setSurface(e.target.value as Surface | 'all')} className={selectCls}>
          <option value="all">All surfaces</option>
          {SURFACES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={kind} onChange={e => setKind(e.target.value as Kind | 'all')} className={selectCls}>
          <option value="all">All kinds</option>
          {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {/* List — source language only; the panel handles the rest */}
      <div className="bg-white border border-neutral-400 rounded-[14px] overflow-hidden shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-5 py-2.5 border-b border-neutral-300 bg-neutral-100">
          <span className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wide">Key</span>
          <span className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wide">English · source</span>
          <span className="text-[11px] font-[600] text-neutral-500 uppercase tracking-wide w-[120px] text-right">Locales</span>
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13px] text-neutral-400">No keys match.</p>
        ) : filtered.map(entry => {
          const missingCount = otherLocales.filter(l => isMissing(entry, l, state.overrides)).length
          const isSelected = selectedKey === entry.key
          return (
            <button
              key={entry.key}
              onClick={() => setSelectedKey(entry.key)}
              className={cn(
                'w-full grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3.5 border-b border-neutral-200 last:border-b-0 text-left transition-colors cursor-pointer',
                isSelected ? 'bg-brand-tint/30' : 'hover:bg-neutral-100',
              )}
            >
              <div className="min-w-0 flex flex-col gap-1.5">
                <p className="font-mono text-[11.5px] text-neutral-900 leading-4 break-all">{entry.key}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge tone="neutral" size="sm">{entry.surface}</Badge>
                  <Badge tone="neutral" size="sm">{entry.kind}</Badge>
                  {state.overrides[entry.key] && <Badge size="sm">Edited</Badge>}
                </div>
                {entry.context && (
                  <p className="text-[11px] text-neutral-500 leading-[1.45] line-clamp-2">{entry.context}</p>
                )}
              </div>
              <p className="text-[12.5px] text-neutral-900 leading-[1.5] whitespace-pre-wrap self-center">
                {resolve(entry.key, SOURCE_LOCALE)}
              </p>
              <div className="w-[120px] flex items-center justify-end gap-1.5 self-center">
                {missingCount > 0
                  ? <Badge tone="neutral" size="sm">{missingCount} missing</Badge>
                  : <Badge size="sm">{otherLocales.length}/{otherLocales.length}</Badge>}
                <ChevronRight size={14} strokeWidth={1.5} className="text-neutral-400 shrink-0" />
              </div>
            </button>
          )
        })}
      </div>

      {/* System notes — the architecture, with its receipts */}
      <div className="border border-neutral-400 rounded-[14px] bg-bg-control px-6 py-5 flex flex-col gap-3 max-w-[760px]">
        <h2 className="text-[14.5px] font-[600] text-neutral-900">How this system works</h2>
        <ul className="flex flex-col gap-2 text-[12.5px] text-neutral-700 leading-[1.6] list-disc pl-4">
          <li><span className="font-[500]">Semantic keys, never content-as-key</span> — <span className="font-mono text-[11.5px]">surface.component.element</span>, so copy can change without orphaning the key (the convention Lokalise and Locize recommend).</li>
          <li><span className="font-[500]">Source-language list, per-key locale panel</span> — the list stays readable at 50 locales because locales live in the key's panel, not in columns (the Lokalise list + key-editor model).</li>
          <li><span className="font-[500]">Never reuse a key</span> — textual sameness isn't semantic sameness; the two "End" buttons in this app are separate keys so each can evolve.</li>
          <li><span className="font-[500]">Context is the highest-leverage metadata</span> — every key carries a writer-facing note (where it shows, constraints), the field translation tools rank first.</li>
          <li><span className="font-[500]">Edits are overrides</span> — changing a value layers on top of the catalog and updates the live app; "Edited" marks drift from source, the way Lokalise auto-flags translations when source copy changes.</li>
          <li><span className="font-[500]">AI speech is excluded by design</span> — the builder's spoken replies are conversational model output, not product copy. The builder's greeting is in the system (it's scripted) but en-only until spoken Korean is validated.</li>
          <li><span className="font-[500]">Coverage is incremental</span> — the agent-building path (shell, agents list, builder, agent detail, flow, simulation) is fully migrated; legacy pages (Voice Library, Avatars, onboarding) still carry literals and join the catalog as they're touched.</li>
        </ul>
      </div>

      {selectedKey && <KeyDetailPanel entryKey={selectedKey} onClose={() => setSelectedKey(null)} />}
    </div>
  )
}
