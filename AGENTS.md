## Goal
Refactor and unify the entire AsamApp frontend around a warm "Ember Dark" color system, fix contrast across all inputs/cards/backgrounds, and restructure key pages to match a consistent premium dark palette.

## Constraints & Preferences
- No pure black `#000`, no pure white `#fff`, no cold gray borders
- Font: DM Sans throughout (Instrument Serif only on landing hero h1)
- App in `/frontend/src/`, landing in `/landing/`
- Input background matches card background (`bg-card` = `#1F1A14`) for integrated dark look
- All text/JSX logic untouched — only CSS classes, Tailwind, and inline styles change
- NewMarketPurchase now structurally identical to QuickQuote (Card components, label style, input class, summary layout)

## Progress
### Done
- **Sidebar redesign**: grouped nav (GESTIÓN, COTIZACIONES, INVENTARIO, FINANZAS, OTROS) with bg `#110E0A`, group labels `#7A6858`, nav items `#A89880`, active `rgba(232,131,74,0.14)` with left-border accent
- **Global contrast overhaul**: every JSX file scanned and cleaned of `text-white`, `text-zinc-*`, `bg-zinc-*`, `border-zinc-*`, `bg-[#111]`, `bg-[#161310]`, `text-[#8A7A6A]`, `border-[rgba(255,220,160,0.08)]` — zero remaining old color classes across all 20 page files
- **CSS variables updated** (phase 2): `--surface: #1F1A14`, `--surface2: #2C2419`, `--foreground: #F0E6D3`, `--muted: #B8A48A`, `--text-hint: #8A7560`, `--border: rgba(255,210,140,0.18)`, `--border2: rgba(255,210,140,0.30)`, `--input: rgba(255,210,140,0.30)`
- **Dashboard metric cards**: bg `#272018`, border `1px solid rgba(255,220,160,0.18)`, number `38px` `700` `#F5EDE0`, label `#A89880` `11px` uppercase, progress bars removed
- **Dashboard breadcrumb**: badge replaced with plain text `#7A6858` `13px`
- **Dashboard title/subtitle**: "Panel de control" `#F5EDE0` `700`, "Accesos rápidos…" `#A89880`
- **Form visibility fix**: NewEvent.jsx and QuickQuote.jsx inputs use `bg-[#2C2419]`, `border-[rgba(255,210,140,0.22)]`, labels `#B8A48A` `11px` uppercase `tracking-[0.08em]`, stepper inactive `rgba(255,210,140,0.25)` circles with `#8A7560` text, section titles `#F0E6D3` `font-semibold`, inset shadows removed
- **NewMarketPurchase**: fully refactored to shadcn Card components — every section wrapped in `Card`/`CardHeader`/`CardTitle`/`CardContent`, inputs use `bg-card` (= `#1F1A14`), labels use `text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase`, add-item area uses `bg-card` with `border-border/60`, summary card uses `Card` with sticky positioning, save button is flat full-width — structurally identical to QuickQuote
- **Landing page**: `--surface`, `--muted`, `--border` updated to match new contrast levels

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- QuickQuote is the visual reference standard: Card-component structure, muted `border-border/60` card borders, `bg-card` inputs, uppercase `text-muted-foreground` labels, sticky summary panel
- `--card: var(--surface)` = `#1F1A14` used throughout for consistent integrated dark look
- `<Card>` border uses `border-border/60` (≈10.8% opacity) per shadcn defaults — much more subtle than prior custom borders
- `size-4.5` remains invalid in Tailwind v4 — silently ignored, not applied (consistent with QuickQuote usage)
- All 20 page JSX files audited; no lingering old color classes found

## Next Steps
- No remaining tasks — full contrast overhaul and NewMarketPurchase refactor complete
- Future: verify runtime rendering (dev server + browser check) when user runs the app

## Critical Context
- `getStatusVariant` must remain imported in EventDetail.jsx — omitting it causes a blank page crash
- Build succeeds with no errors; Vite dev server on port 5173
- Backend Node.js processes must be running for data access
- `#root .bg-background { background: transparent; }` kept so body shows through
- All JSX files are now free of old zinc/gray color classes — only the warm palette remains
- NewMarketPurchase uses `./NewEvent.css` for `.ne-grid` grid layout (shared with QuickQuote, NewEvent, EditEvent)

## Relevant Files
- `frontend/src/index.css`: complete color system (layer variables, @theme, body color, form-input, glass, card)
- `frontend/src/components/ui/card.jsx`: shadcn Card with `bg-card` + `border-border/60` + hover lift
- `frontend/src/components/ui/input.jsx`: shadcn Input with ring focus (inherits new colors automatically)
- `frontend/src/components/Layout.jsx`: sidebar with grouped nav categories, expanded + collapsed states, collapse/command buttons
- `frontend/src/pages/Dashboard.jsx`: refactored metric cards, quick-access cards, upcoming events, breadcrumb, title
- `frontend/src/pages/NewMarketPurchase.jsx`: Card-component structure matching QuickQuote's visual style
- `frontend/src/pages/QuickQuote.jsx`: reference target for card style, labels, and summary layout
- `frontend/src/pages/NewEvent.jsx`: 3-step wizard with updated input/label/stepper colors
- `frontend/src/pages/NewEvent.css`: shared grid rules (`.ne-grid`, `.ne-summary-container`, `.insumos-grid`)
- `landing/styles.css`: contrast-updated variables matching the app palette
