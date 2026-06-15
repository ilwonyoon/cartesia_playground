/* ── Content entry model ───────────────────────────────────────────
   One entry per piece of product copy. The metadata mirrors what
   dedicated tools (Lokalise, Ditto) treat as first-class: a stable
   key, per-locale values, a writer-facing context note, and a
   taxonomy (surface + kind) for filtering at scale.

   Key convention: `surface.component.element[.qualifier]`
   e.g. builder.composer.placeholder.listening */

export type Surface =
  | 'shell'       // sidebar, top bar, navigation
  | 'agents'      // the Voice Agents list page
  | 'builder'     // the Build conversation panel
  | 'agent'       // agent detail header + configuration
  | 'preview'     // the Phone/Widget preview panel
  | 'flow'        // the Flow tab
  | 'simulation'  // test callers
  | 'eval'        // deviations list
  | 'kb'          // knowledge base tab
  | 'deploy'      // deployment + widget tabs

export type Kind =
  | 'title'        // page/section headings
  | 'label'        // field & item labels
  | 'cta'          // buttons and actions
  | 'placeholder'  // input placeholder text
  | 'hint'         // supporting/explainer copy
  | 'empty'        // empty states
  | 'status'       // live states (Listening…, Deploying)
  | 'badge'        // chips and badges
  | 'error'        // failure copy

export interface ContentEntry {
  key: string
  value: { en: string; ko?: string }
  /** Writer-facing note: where it shows, tone, constraints. */
  context?: string
  surface: Surface
  kind: Kind
}
