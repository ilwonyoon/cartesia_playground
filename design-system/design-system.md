# Cartesia Design System

Extracted from Figma file `1YGgTyZ9Y9qQEGQALikC2p` — 2026-06-01.  
Source: Figma REST API + visual inspection of all 14 unique screens.

---

## Color Palette

### Brand
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-green` | `#004d22` | CTAs, icons, logo, active nav, filled buttons |
| `brand-green-light` | `#309d4b` | Hover, success dot indicators |
| `brand-green-tint` | `#dbe6d0` | Play button bg, subtle green surface |

### Neutral Scale (warm — slight beige/yellow cast throughout)
| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-900` | `#39342f` | Primary text, headings |
| `neutral-800` | `#444444` | Strong secondary text |
| `neutral-700` | `#525150` | Sidebar nav text, icons |
| `neutral-600` | `#626160` | Secondary text |
| `neutral-500` | `#737373` | Tertiary / placeholder / description |
| `neutral-400` | `#dfdbd6` | Borders, dividers, card strokes |
| `neutral-300` | `#efeee8` | Sidebar bg, secondary surfaces |
| `neutral-200` | `#f4f4f4` | Inner sidebar bg |
| `neutral-100` | `#f9f9f8` | Main content bg (page canvas) |
| `neutral-50` | `#fdfdfc` | Card / elevated surface |
| `white` | `#ffffff` | Pure white (modal, input bg) |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#39342f` | Body, headings |
| `text-secondary` | `#737373` | Descriptions, sub-labels |
| `text-muted` | `#525150` | Nav labels, disabled-ish |
| `bg-page` | `#f9f9f8` | Page background |
| `bg-sidebar` | `#efeee8` + `#f4f4f4` | Left nav |
| `bg-card` | `#ffffff` / `#fdfdfc` | Cards, panels |
| `border` | `#dfdbd6` | All dividers and card borders |
| `danger` | `#fa2b36` | Error text, destructive |
| `warning-surface` | `rgba(#fa2b36, 0.08)` | Upgrade banner bg (salmon tint) |

**Critical insight:** Every gray in the product has a warm undertone. Never use neutral grays like `#888` or `#f5f5f5` — they read as foreign.

---

## Typography

**Font stack:**
| Role | Family | Foundry | Usage |
|------|--------|---------|-------|
| `sans` | ABC Diatype | Dinamo | UI default — nav, labels, body, buttons |
| `serif` | Tiempos Text | Klim | Page titles ("Voice Agents"), headings |
| `display` | PP Kyoto | Pangram Pangram | Hero/display text |
| `mono` | IBM Plex Mono | IBM | Code, API endpoints, parameter labels |
| `ipa` | Doulos SIL | SIL | Phonetic/pronunciation symbols |

Note: Figma screenshots showed Inter, but actual product uses ABC Diatype as the primary sans.

### Scale
| Name | Size | Weight | Line Height | Context |
|------|------|--------|-------------|---------|
| `display` | 24px | 500 | 32px | Page titles ("Voice Agents", "Welcome to Cartesia") |
| `heading` | 19px | 600 | 28px | Section headings ("Pronunciation Dictionaries") |
| `subheading` | 17–18px | 400 | 28px | Wizard step titles ("Repository Information for...") |
| `label-strong` | 14px | 600 | 21px | Tab labels, list item primary text |
| `label` | 14px | 500 | 20px | Buttons, form field labels, action links |
| `label-sm` | 13px | 500 | 20px | Nav items, secondary labels |
| `label-xs` | 12px | 500 | 19px | API ref links, micro labels |
| `body` | 15px | 400 | 24px | Onboarding descriptions |
| `body-sm` | 13px | 400 | 24px | Card descriptions, help text |
| `body-xs` | 11px | 400 | 16px | Character counters, meta info |
| `code` | 13px | 400 | 20px | API endpoint labels (`POST /voices/localize`) — monospace |

### Notable patterns
- **Field labels in forms** use `code`-style monospace for parameter names (`voice_id *`, `original_speaker_gender *`)
- **Required asterisk** is red (`#fa2b36`), displayed inline with field label
- **"Beta" badge**: small pill, blue tint, ABC Diatype 500 11px

---

## Spacing

Base unit: 4px.

| Token | Value | Primary use |
|-------|-------|-------------|
| `space-1` | 4px | Icon-to-label gap, tight inline |
| `space-2` | 8px | Inner padding, button padding-y |
| `space-3` | 12px | Form field inner padding |
| `space-4` | 16px | **Standard gap** — most used everywhere |
| `space-5` | 20px | Section internal gap |
| `space-6` | 24px | Card padding, section gap |
| `space-8` | 32px | Between major sections |
| `space-10` | 40px | Page content top padding |
| `space-12` | 48px | Container padding (left/right) |
| `space-16` | 64px | Large structural gap |
| `space-24` | 96px | Hero spacing |
| `space-32` | 128px | Max structural |

---

## Border Radius

| Token | Value | Used on |
|-------|-------|---------|
| `radius-sm` | 6px | Tags, small chips, inline badges |
| `radius-md` | 8px | Buttons, dropdowns, inputs |
| `radius-lg` | 10px | Cards (most common) |
| `radius-xl` | 14px | Large panels |
| `radius-2xl` | 16px | Modals, popovers, wizard panels |
| `radius-full` | 9999px | Avatar circles, pill buttons, FAB |

---

## Shadows

```css
/* Subtle — inputs, small cards */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.15);

/* Float — cards, dropdowns, wizard panels */
--shadow-md:
  0 8px 10px -6px rgba(0, 0, 0, 0.10),
  0 20px 25px -5px rgba(0, 0, 0, 0.10);

/* Ring — focus, card border emphasis */
--shadow-ring: 0 0 0 1px rgba(57, 52, 47, 0.10);
```

---

## Layout

| Property | Value |
|----------|-------|
| Canvas max-width | 1440px |
| Sidebar width | ~220px |
| Main content left padding | 48px |
| Main content right padding | 48px |
| Main content top padding | 40px |

**Two-column layout:** Fixed sidebar left + scrollable main right. No top nav bar — Cartesia uses sidebar-only navigation.

---

## Components

### Sidebar Navigation
- Logo top-left (Cartesia mark + wordmark, `#004d22`)
- Section headers: ABC Diatype 400 11px, `neutral-700`, uppercase tracking — `Models`, `Agents`, `Voices`, `Manage`
- Nav items: ABC Diatype 500 13px, `neutral-700`. Active state: darker bg + green icon
- Icon + label pattern: 16px icon, 8px gap, label
- Bottom: Org switcher (avatar + org name) + user settings icon
- FAB bottom-right: circular `#004d22` button (Pylon support widget)

### Buttons

**Primary (filled)**
- Bg: `#004d22`, text: white, radius: 8px
- Hover: slightly lighter green
- With icon: `+ Create voice agent` — icon left, 8px gap
- Split button: main action + chevron dropdown (separated by thin vertical border, same bg)

**Secondary (ghost)**
- Border: `neutral-400`, bg: transparent, text: `neutral-900`
- `Back` button in wizard flows

**Outline pill**
- `View API reference →` — small, outlined, radius-full

**Inline action**
- `Use` — text only, 14px, right-aligned in list rows

### Inputs & Forms
- Border: `neutral-400`, radius: 8px, bg: white
- Placeholder: `neutral-500`
- Label: monospace 13px for API param names, ABC Diatype 500 14px for regular labels
- Required marker: `*` in red (`#fa2b36`) inline with label
- Character counter: body-xs, right-aligned below input
- Help text: body-sm, `neutral-500`, below input

**Form layout pattern** (used in Localize Voice, Agent Config):
- Label + description left column
- Control (dropdown/input/toggle) right column
- Full-width horizontal divider between rows
- Section headers (`Source`, `Target`) in label-strong above groups

### Dropdown / Select
- Same radius/border as input
- Trailing chevron icon
- Disabled state: lower opacity, "Choose a language..." placeholder

### Toggle Switch
- Standard iOS-style toggle
- Green when on (`#004d22`), gray when off
- Used with gender selector (♂ / ♀ icons flanking)
- `Beta` badge appears inline with toggle label

### Tabs
- Underline style — active tab: dark text + 2px bottom border (`neutral-900`)
- Inactive: `neutral-500`
- Used on Agent detail page: `Configuration | Deployment | Environment | Metrics | Calls | Settings`

### Breadcrumbs
- `All agents > Create new agent > Start with example code > Template`
- ABC Diatype 400 13px, `neutral-500`, `>` separator, final item `neutral-900`
- Appears below sidebar, above page title

### Page Header (Agent detail)
- Agent name (display size), ID chip (code font, gray bg), branch tag
- Primary action button top-right (`Call` with phone icon + split chevron)

### Cards
- Border: `neutral-400` (1px), radius: 10px, bg: white
- Padding: 24px
- Subtle shadow: `shadow-sm` or `shadow-ring`

**Selectable card** (wizard options):
- Dashed border when unselected (`neutral-400`)
- Solid + shadow when selected

**Metric card** (Subscription page):
- Two-column grid, equal width
- Large number (display), label above, description below

### List Rows (Voices, Plans)
- Full-width, top/bottom border divider
- Left: play button (circle `#dbe6d0` bg, `#004d22` icon) + flag emoji + name + description
- Right: `Use` action link or price
- Radio button left for plan selection

### Empty State
- Centered vertically in content area
- Icon (48px, `neutral-400`), heading (label-strong), optional CTA button below
- Used: Voice Agents (empty), Pronunciation (no dictionaries)

### Banners
- Full-width, below sidebar header line
- Warning: salmon tint bg, dark red text, left icon
- E.g.: "Please upgrade to invite more members to your Organization."

### Wizard / Multi-step Flow
- Full-page centered content (no card chrome) on white/`neutral-100` bg
- Large bold title (24–28px, 700)
- Subtitle below in `neutral-500`
- Breadcrumb navigation at top
- Back (ghost) / Next or Create Agent (primary) at bottom, full-width row
- Form content in a contained panel (~760px max-width, centered)

### Code / API Endpoint Label
- Monospace, 13px, `neutral-700`
- Shown below form field as endpoint hint: `POST /voices/localize`
- No background — just inline text above CTA button

### Beta Badge
- Small rounded pill, blue-tinted bg, ABC Diatype 500 11px
- Appears inline with feature labels

---

## Screen Inventory & Unique Patterns

| Screen | Key patterns |
|--------|-------------|
| **Home / Welcome** | 4-up icon grid (Get started), voice list rows with play buttons |
| **Voice Agents (empty)** | Empty state + split CTA card (Start in Playground / Start with example code) |
| **Speech-to-Text playground** | Large centered mic FAB, "Need a topic?" prompt card, full-bleed canvas |
| **Localize Voice** | Form layout (param labels + controls), monospace field names, POST endpoint label |
| **Pronunciation** | Empty state with primary CTA button |
| **API Keys** | (Similar to list page pattern) |
| **Subscription** | Warning banner, metric cards grid, tabbed Monthly/Annual toggle, radio plan list |
| **Agent: new template (step 1)** | Wizard — Git scope + repo name form |
| **Agent: new template (step 2)** | Wizard — Checkbox metric list with code return types |
| **Agent: configuration** | Tabbed detail page, settings rows (label+desc / control), toggle with Beta |

**Duplicate / skipped:**
- `9:4902` = `9:4485` + Pylon support widget open (same underlying UI)
- Section wrappers (`9:2586`, `9:2810`, `9:3121`, `9:3453`) = same content as their inner frames

---

## Design Language — Key Principles

1. **Warm neutrals everywhere.** Never pure cold gray. All surfaces have a slight cream/beige cast.
2. **One accent color.** `#004d22` dark forest green is the only color. Used sparingly — buttons, active states, icons. Everything else is neutral.
3. **Dense but airy.** Small type (13–14px base), tight spacing within components, but generous whitespace between sections.
4. **ABC Diatype (sans) + Tiempos Text (serif) for headings. Three weights (400/500/600).** Three weights (400/500/600). No decorative or display fonts.
5. **No color for information hierarchy.** Hierarchy is communicated purely through weight, size, and opacity — not hue.
6. **Monospace for API/code context.** Param names and endpoints use monospace to signal technical context inline.
7. **Consistent 10px/16px radius.** Cards = 10px. Panels/modals = 16px. Buttons/inputs = 8px.
8. **No top nav bar.** 100% sidebar-driven. Breadcrumbs handle depth signaling.

---

## Implications for "Give Your Agent a Face" Feature

- **New tab in agent detail** — add "Avatar" between Configuration and Deployment tabs
- **Upload flow:** use the wizard pattern (centered panel, large title, Back/Next)
- **Image upload zone:** dashed border card, same radius-2xl (16px), `neutral-400` dashed border
- **Preview area:** large white card, `shadow-md`, same warm bg behind avatar
- **Any new color:** don't introduce it. Use `#dbe6d0` tint for highlight states, `#004d22` for active icons
- **Toggle for avatar on/off:** same toggle component as Language Detection
- **"Beta" badge:** add to Avatar tab label — it's already established as the low-commitment signal for new features
- **Embed code block:** match monospace style already used for API endpoints
