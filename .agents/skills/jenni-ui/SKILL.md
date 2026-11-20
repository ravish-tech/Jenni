---
name: jenni-ui
description: >-
  Design philosophy, spatial rules, token system, and best-practice component patterns for building web interfaces with jenni-core, jenni-vue (Vue 3), and jenni-react (React 19). Activate this skill whenever a project uses jenni-core, jenni-vue, or jenni-react, or when building layouts, forms, dense data views, overlays, themes, or keyboard shortcuts with this UI framework.
---

# UI Framework Guide (`jenni-core` · `jenni-vue` · `jenni-react`)

**Jenni** *(pronounced “yenni”, `/ˈjɛni/`)* is a multi-tier web UI framework driven by **beauty, simplicity, and performance** — built in loving memory of Jenni, as a tribute to her grace and elegance.

> **Respectful Naming Rule:** Treat the name with dignity. Keep it strictly to package/import identifiers (`jenni-core`, `jenni-vue`, `jenni-react`) and any single top-level dedication. Never use the name casually in prose (*"the framework provides…"* rather than *"Jenni provides…"*) or in placeholder/mock brand strings.

---

## 1. Never Guess Props — Read the Machine-Readable Manifest First

Before using an unfamiliar component, check its exact AST-generated props, `v-model` bindings, events, slots, and CSS slug in the manifest:

1. **Local workspace (`node_modules`):** `node_modules/jenni-core/manifest.json` (or `COMPONENT_MANIFEST.json` in the monorepo root).
2. **Web fallback:** `https://ravish-tech.github.io/Jenni/COMPONENT_MANIFEST.json` (and `https://ravish-tech.github.io/Jenni/llms-full.txt`).

Quick lookup command in any consuming repo:
```sh
node -e 'const m=require("./node_modules/jenni-core/manifest.json"); console.log(m.components.find(c=>c.reactName==="DataGrid"))'
```

---

## 2. Core Philosophy & Non-Negotiable Rules

### A. Mature Elegance & Weighted Motion (Zero Bounce)
- **Zero overshoot / zero bounce:** Never add spring overshoot (`> 1.0`), rubbery thumb stretching, playful rotations, or active button squishing (`scale(0.95)`).
- **Precision-damped glide:** Use token durations and curves (`--j-duration-fast` `150ms`, `--j-duration` `220ms`, `--j-duration-slow` `300ms`; `--j-ease-out: cubic-bezier(0.19, 1, 0.22, 1)`, `--j-ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1)`). Animate only `transform`, `opacity`, `background-color`, `box-shadow`, and `color`.

### B. Spatial Grid & Semantic Relationships (`4px` / `8px` + Density)
- **Never hardcode arbitrary pixel gaps** (`10px`, `14px`, `18px`). Compose layouts with `JStack`/`Stack`, `JInline`/`Inline`, `JGrid`/`Grid`, and `JPage`/`Page` using semantic `gap` tokens that scale automatically with `[data-density]` (`0.65×`–`1.15×`):
  - `inline` (`6px`) — icon + label, adjacent badges
  - `related` (`8px`) — button pairs, toolbar clusters
  - `item` (`12px`) — list items, compact cards
  - `field` (`16px`) — form fields inside a group
  - `group` (`24px`) — card groups, subsections
  - `section` (`40px`) — major page sections
- **Canonical control heights:** Every interactive control (`Button`, `Input`, `Select`, `Combobox`, `DatePicker`, `SegmentedControl`) shares identical `sm` (`28px`), `md` (`36px`), and `lg` (`44px`) heights scaled by `--j-density` so inline toolbars and filter bars align to the sub-pixel.

### C. Zero Specificity Wars (`@layer` + Tokens Only)
- **Zero `!important`:** All framework styles live inside `@layer jenni.tokens, jenni.base, jenni.components;` wrapped in `:where(...)`. Any unlayered application class overrides component styles cleanly without `!important`.
- **Zero raw colors:** Always reference semantic OKLCH `light-dark()` tokens (`var(--j-bg)`, `var(--j-surface-1..3)`, `var(--j-fg)`, `var(--j-fg-muted)`, `var(--j-border)`, `var(--j-accent)`). Theme (`light` | `dark`), palette (`data-tone`), density (`data-density="compact"` or `--j-density: 0.82`), and corner sharpness (`--j-radius-factor`) adapt automatically.

### D. Honest Action Feedback ("Never Show Success You Didn't Verify")
- For mutations and network calls, **never** fire an optimistic `toast.success(...)` before verifying the response payload.
- Always use `toast.promise(fn, { loading, verify, success, error })` or `toast.fromResult(result, opts)`: HTTP 200 envelopes with `{ ok: false, error }` or failed `verify(data)` checks automatically transition the in-flight spinner toast to `danger` instead of false success.

---

## 3. Stylesheet Imports (Full vs. Granular Per-Component CSS)

```ts
// Option 1: Full minified stylesheet (~65 kB gzip) — simplest for full apps
import 'jenni-core/css';

// Option 2: Granular per-component minified CSS — smallest bundle
import 'jenni-core/css/foundation.css'; // required once (tokens + base reset)
import 'jenni-core/css/button.css';
import 'jenni-core/css/data-grid.css';
```

---

## 4. Choosing the Right Component

- **Application Chrome:** Use `JAppShell` / `AppShell` (`16` layouts: `sidebar`, `header-sidebar`, `ide`, `workspace`, `copilot`, `split`, `three-pane`, `command-center`, etc. × `4` variants: `flat`, `inset`, `floating`, `contrast`) paired with `JToolbar`/`Toolbar` and `JStatusBar`/`StatusBar` (`#statusbar` slot).
- **Navigation vs. Open Documents:** Use `JTabs` / `Tabs` (`underline` | `pill`) for static view switching; use `JDocTabs` / `DocTabs` for closable, pinnable, reorderable IDE/notebook/browser document strips (`dirty` dot, middle-click close, overflow menu, `@tab-contextmenu`).
- **Tables vs. High-Density Grids & Large Lists:**
  - `< 200` editorial rows: `JTable` / `JDataTable` (`Table` / `DataTable`).
  - `500–50,000+` custom rows or feeds: `JVirtualList` / `VirtualList` (`itemHeight` number or function, or `variableHeight` via `ResizeObserver`).
  - Dense multi-column workbenches: `JDataGrid` / `DataGrid` (virtualized `role="grid"`, `pinned: 'left' | 'right'`, resizable columns, `Shift+Click` / `Shift+Enter` multi-sort, `Shift`-range multi-select, 2D arrow + header keyboard navigation, `@row-contextmenu`).
- **Dialogs & Drawers:** `JDialog`/`Dialog` and `JDrawer`/`Drawer` teleport to `<body>` by default (`teleport` defaults to `true`; pass `:teleport="false"` / `teleport={false}` only for inline container previews). Do **not** wrap them in custom portal components.
- **Context Menus:** `JContextMenu` / `ContextMenu` only closes when an ancestor of its trigger scrolls (streaming sibling logs/terminals never dismiss open menus) and exposes `openAt(x, y)`, `openFor(el)`, and `openFromEvent(e)` on its template `ref`.
- **Icons:** Use `JIcon` / `Icon` (`65` built-in 16×16 stroke icons) and connect app icon libraries once via `provideIcons(resolver)` (Vue), `<IconProvider icons={...}>` (React), or `registerIcons(map)`.
- **Charts, Editors & Terminals:** Use `useThemeTokens()` (Vue/React) or `getThemeTokens()` / `onThemeChange()` (`jenni-core`) to feed live `#rrggbb` colors for `--j-chart-1..8`, `--j-syntax-*` (CodeMirror/Monaco), and 16-color ANSI `xterm.js` `ITheme` (`tokens.terminal`).
- **Keyboard Shortcuts:** Use `useShortcut` / `useShortcuts` (or `registerShortcut`) — pass `{ scope: rootRef }` for view-local shortcuts so hidden tabs, `inert` panes, background views behind modal `<dialog>`, and focused `.xterm` terminals are automatically ignored.

---

## 5. Idiomatic Code Recipes

Read [references/RECIPES.md](./references/RECIPES.md) for copy-ready Vue 3 and React 19 implementation patterns covering shells, dense data grids with context menus, document tabs, verified toasts, custom icon registries, live xterm/chart theming, and scoped shortcuts.
