---
name: jenni-ui
description: >-
  Design philosophy, spatial rules, token system, anti-patterns, and best-practice component patterns for building web interfaces with jenni-core, jenni-vue (Vue 3), and jenni-react (React 19). Activate this skill whenever a project uses jenni-core, jenni-vue, or jenni-react, or when building shells, resizable sidebars, Chrome tab strips, forms, dense data grids, collapsible tables, overlays, themes, or keyboard shortcuts with this UI framework.
---

# UI Framework Guide (`jenni-core` · `jenni-vue` · `jenni-react`)

**Jenni** *(pronounced “yenni”, `/ˈjɛni/`)* is a multi-tier web UI framework driven by **beauty, simplicity, and performance** — built in loving memory of Jenni, as a tribute to her grace and elegance.

> **Respectful Naming Rule:** Treat the name with dignity. Keep it strictly to package/import identifiers (`jenni-core`, `jenni-vue`, `jenni-react`, `jenni-ui`) and any single top-level dedication. Never use the name casually in prose (*"the framework provides…"* rather than *"Jenni provides…"*) or in placeholder/mock brand strings.

---

## 1. Never Guess Props — Read the Machine-Readable Manifest First

Before using an unfamiliar component, inspect its AST-generated props, defaults, `v-model` bindings, events, slots, exposed methods, and granular CSS slug in the manifest:

1. **Local workspace (`node_modules`):** `node_modules/jenni-core/manifest.json` (also bundled in `node_modules/jenni-vue/manifest.json`, `node_modules/jenni-react/manifest.json`, and `AGENTS.md` inside each package).
2. **Web fallback:** `https://ravish-tech.github.io/Jenni/COMPONENT_MANIFEST.json` and `https://ravish-tech.github.io/Jenni/llms-full.txt`.

Quick lookup command in any consuming repo:
```sh
node -e 'const m=require("./node_modules/jenni-core/manifest.json"); console.log(m.components.find(c=>c.reactName==="TabStrip"))'
```

---

## 2. Core Philosophy & Non-Negotiable Rules

### A. Mature Elegance & Weighted Motion (Zero Bounce)
- **Zero overshoot / zero bounce:** Never add spring overshoot (`> 1.0`), rubbery thumb stretching, playful rotations, or active button squishing (`scale(0.95)`).
- **Precision-damped glide:** Use token durations and curves (`--j-duration-fast` `150ms`, `--j-duration` `220ms`, `--j-duration-slow` `300ms`; `--j-ease-out: cubic-bezier(0.19, 1, 0.22, 1)`, `--j-ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1)`). Animate only `transform`, `opacity`, `background-color`, `box-shadow`, and `color`.
- **Popover exit stability:** Popover/menu panels keep layout properties (`flex-direction: column`) on the base selector rather than only under `&:popover-open`, so items never collapse into a row during `allow-discrete` exit fades.

### B. Spatial Grid & Semantic Relationships (`4px` / `8px` + Density)
- **Never hardcode arbitrary pixel gaps** (`10px`, `14px`, `18px`). Compose layouts with `JStack`/`Stack`, `JInline`/`Inline`, `JGrid`/`Grid`, and `JPage`/`Page` using semantic `gap` tokens that scale automatically with `[data-density]` (`0.65×`–`1.15×`):
  - `inline` (`6px`) — icon + label, adjacent badges
  - `related` (`8px`) — button pairs, toolbar clusters
  - `item` (`12px`) — list items, compact cards
  - `field` (`16px`) — form fields inside a group
  - `group` (`24px`) — card groups, subsections
  - `section` (`40px`) — major page sections
- **Canonical control heights:** Every interactive control (`Button`, `Input`, `Select`, `Combobox`, `DatePicker`, `SegmentedControl`, `SplitButton`) shares identical `sm` (`28px`), `md` (`36px`), and `lg` (`44px`) heights scaled by `--j-density` so inline toolbars and filter bars align to the sub-pixel.

### C. Zero Specificity Wars (`@layer` + Tokens Only)
- **Zero `!important`:** All framework styles live inside `@layer jenni.tokens, jenni.base, jenni.components;` wrapped in `:where(...)`. Any unlayered application class overrides component styles cleanly without `!important`.
- **Zero raw colors:** Always reference semantic OKLCH `light-dark()` tokens (`var(--j-bg)`, `var(--j-surface-1..3)`, `var(--j-fg)`, `var(--j-fg-muted)`, `var(--j-border)`, `var(--j-accent)`). Theme (`light` | `dark`), palette (`data-tone`), density (`data-density="compact"` or `--j-density: 0.82`), and corner sharpness (`--j-radius-factor`) adapt automatically.

### D. Honest Action Feedback ("Never Show Success You Didn't Verify")
- For mutations and network calls, **never** fire an optimistic `toast.success(...)` before verifying the response payload.
- Always use `toast.promise(fn, { loading, verify, success, error })` or `toast.fromResult(result, opts)`: HTTP 200 envelopes with `{ ok: false, error }` or failed `verify(data)` checks automatically transition the in-flight spinner toast to `danger` instead of false success.

---

## 3. Stylesheet Imports (Full vs. Granular Per-Component CSS)

```ts
// Option 1: Full minified stylesheet — simplest for full apps
import 'jenni-core/css';

// Option 2: Granular per-component minified CSS — smallest bundle
import 'jenni-core/css/foundation.css'; // required once (tokens + base reset)
import 'jenni-core/css/button.css';
import 'jenni-core/css/tab-strip.css';
import 'jenni-core/css/sidebar-layout.css';
```

---

## 4. Component Decision Matrix (Choosing the Right Primitive)

### Chrome, Shells & Resizable Panes
- **Top-level application frame:** `JAppShell` / `AppShell` (`16` container-query layouts × `4` variants) paired with `JToolbar`/`Toolbar`, `JMenubar`/`Menubar`, and `JStatusBar`/`StatusBar` (`size="sm|md|lg"`, `textSize="xs|sm"`, `mono`, `--j-statusbar-h`).
- **View-level collapsible & resizable sidebar (`open | rail | hidden`):** `JSidebarLayout` + `JSidebarToggle` (`SidebarLayout` + `SidebarToggle`). Persists width + state via `storageKey`, measures drag width relative to its own root bounding box (works inside docked sidebars or offset shells), provides an edge hover toggle + right-click edge context menu (`Show / Rail / Hide`), and renders `<JSidebarToggle />` automatically via context in any toolbar/header.
- **Multi-panel & recursive splitters:** Use `JResizableGroup` / `ResizableGroup` for standard 2–3 pane splits; use headless `JSplitHandle` / `SplitHandle` (or CSS `.j-resize-handle`) for recursive split trees, docked bottom drawers, or custom pixel-sized panes.
- **Sticky page headers:** Pass `sticky` on `JPageHeader` / `PageHeader` (or `stickyHeader` on `JPage` / `Page`). Uses an `IntersectionObserver` sentinel (zero scroll listeners) to reveal a `--j-border` bottom hairline only while `data-stuck` is active.

### Tab Systems (`TabStrip` vs. `DocTabs` vs. `Tabs`)
- **Window title-bar tabs & rich multi-document strips (`SQL`, browser, IDE):** `JTabStrip` / `TabStrip` — supports `pinned`, `preview` (italic), `dirty`, `loading` spinner, `indicator` dot, `description` hover card, activate on `pointerdown`, middle-click close, drag-to-reorder (`@reorder`), drag-out detach (`@detach`), tab-search filter dropdown (`:search="true"`), built-in + extensible `#context-menu`, `:titlebar="true"` top-edge `y=0` hit targets (`--j-tab-strip-gap`), and `--j-tab-strip-active-bg` to match editor backgrounds.
- **Lightweight document strip:** `JDocTabs` / `DocTabs` when you only need compact closable/pinnable/dirty tabs with `#tab` slot customization.
- **Static section switching:** `JTabs` / `Tabs` (`underline` | `pill`).

### Data Views (`DataGrid` vs. `Table` + `TableSection` vs. `VirtualList`)
- **Editorial or grouped tables (`< 300` rows):** `JTable` / `Table` — use `JTableSection` / `TableSection` (`v-model:expanded-sections`, keyboard roving skip of collapsed rows, `expandAll()` / `collapseAll()`) for collapsible category/group headers.
- **Large custom feeds (`500–50,000+` items):** `JVirtualList` / `VirtualList` (fixed `O(1)` or `ResizeObserver` `variableHeight`).
- **High-density multi-column workbenches:** `JDataGrid` / `DataGrid` (virtualized `role="grid"`, pinned `left`/`right` columns, resizable headers, `Shift+Click` multi-sort, `Shift`-range multi-select, `@row-contextmenu`).
- **KPIs, Telemetry, Diffs & Metadata:** `JStat` / `JStatGroup`, `JSparkline`, `JProgressRing`, `JTimeline` / `JTimelineItem`, `JDescriptionList` / `JDescriptionItem`, `JBanner`, and `JCodeBlock` + `JCopyButton`.

### Forms, Dialogs & Icons
- **Clearable controls:** Both `JInput` (`clearable`) and native `JSelect` (`clearable`, `emptyValue`, `clearLabel`, `clearTooltip`) support inline clear buttons without sacrificing native accessibility.
- **Dialogs & Destructive Confirmations:**
  - `JDialog` / `Dialog` teleports to `<body>` by default, scrolls its `.j-dialog__body` natively, and supports `<JButton default>` inside `#footer` (or `defaultAction` on `JDialog`) so the primary button receives focus on open and triggers on `Enter` whenever focus is not inside a text input, textarea, select, contenteditable, or another button (respecting `Shift+Enter` and IME composition).
  - `JAlertDialog` / `AlertDialog` (`role="alertdialog"`) enforces explicit confirmation for destructive actions (`tone="danger" | "warning" | "accent"`).
- **HD Icons & Font/Registry Scaling:** `JIcon` / `Icon` ships `130+` crisp `24×24` `geometricPrecision` stroke icons with size-calibrated optical stroke weights. `.j-button`, `.j-toggle`, `.j-badge`, `.j-breadcrumb`, `.j-pagination`, `.j-empty-state`, `.j-combobox`, and `.j-statusbar` automatically size direct `<JIcon>` children without manual `size` props. If connecting a padded icon font (e.g. MDI), set `--j-icon-scale: 1.15` once on `:root`.

---

## 5. Critical Anti-Patterns to Avoid

1. **Do NOT wrap `JDialog` content in `<JScrollArea height="100%">`:** `.j-dialog__body` already scrolls cleanly (`overflow: auto; min-height: 0`). Furthermore, `JScrollArea` dynamically applies `overscroll-behavior: contain` only on axes that actually overflow (`data-overflows-y` / `data-overflows-x`), so wheel events are never swallowed on short content.
2. **Do NOT attach manual `document.addEventListener('keydown', onEnter)` for dialogs:** Mark the primary footer button `<JButton variant="solid" default>` (or pass `:default-action="save"` on `JDialog`).
3. **Do NOT write manual `@scroll` listeners to toggle sticky header borders:** Use `<JPageHeader sticky>` (or `<JPage sticky-header>`).
4. **Do NOT wrap `JDialog`, `JDrawer`, or `JAlertDialog` in custom `<Teleport to="body">` wrappers:** They already teleport to `<body>` by default.
5. **Do NOT hardcode `x = e.clientX` when building splitters:** Use `JSidebarLayout`, `JResizableGroup`, or `JSplitHandle`, which compute deltas/offsets relative to their container rect.
6. **Do NOT leave `useShortcut` unscoped inside multi-tab views:** Always pass `{ scope: rootRef }` so hidden tabs and background panes ignore keystrokes.

---

## 6. Idiomatic Code Recipes

Read [references/RECIPES.md](./references/RECIPES.md) for copy-ready Vue 3 and React 19 patterns covering `JTabStrip`, `JSidebarLayout` + `JSidebarToggle`, `JSplitHandle`, `JDialog` default actions, `JSelect` clearable, `JTableSection` collapsible groups, `JDataGrid` + `JContextMenu`, verified `toast.promise`, icon registries, live `xterm.js`/chart theming, and scoped shortcuts.
