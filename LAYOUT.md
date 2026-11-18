# Spatial & Layout System

The layout system defines **where content lives, how components relate in space, canonical heights, and page-level screen architectures** — inspired by Material Design 3, Apple HIG, Dieter Rams, and Linear.

All spatial rules live as CSS custom properties in `@jenni/core` (`tokens.css` + `components/layout.css`) and scale automatically with `--j-density`.

---

## 1. Base Grid & Density

- **Base grid**: `4px` micro-grid (`--j-space-1`), `8px` structural rhythm (`--j-space-2`).
- **Density multiplier** (`--j-density` / `data-density="compact | default | comfortable"`):
  - **Compact** (`0.65`): high-information workspaces, sidebars, IDE toolbars, dense tables/lists.
  - **Default** (`1.00`): balanced web apps and forms.
  - **Comfortable** (`1.15`): touch-first, consumer, or spacious editorial views.
- **Minimum pointer target**: `--j-hit-min: 44px` on `pointer: coarse` devices.

---

## 2. Semantic Component Gaps (Distance Between Elements)

Components never guess arbitrary pixel margins. Instead, spacing between two elements is chosen by **their semantic relationship**:

| Token | Default (`density=1`) | `gap` prop value | Where to use |
|---|---|---|---|
| `--j-gap-inline` | `6px` | `inline` | Tightly bound peers: icon + label, text + `Kbd`, status dot + text |
| `--j-gap-related` | `8px` | `related` | Sibling controls in one cluster: **Cancel + Save buttons**, filter chips, toolbar icons |
| `--j-gap-item` | `12px` | `item` | Internal slot gap inside a row/card: Avatar + Title + Action |
| `--j-gap-field` | `16px` | `field` | Vertical distance between form `Field`s in a form stack |
| `--j-gap-group` | `24px` | `group` | Distance between distinct `Card`s, grid columns/rows, or sub-groups |
| `--j-gap-section` | `40px` | `section` | Major vertical rhythm between `Section`s on a page |

---

## 3. Canonical Heights (Controls, List Items & Chrome)

### Controls
| Token | Default | Usage |
|---|---|---|
| `--j-control-sm` | `28px` | Compact toolbar buttons, inline chips, dense inputs |
| `--j-control-md` | `34px` | Default buttons, inputs, selects, tabs |
| `--j-control-lg` | `42px` | Primary hero CTAs, prominent search/auth inputs |

### List Items (`JList` / `.j-list`)
List rows have fixed minimum heights so leading icons/avatars, text baselines, and trailing actions align rhythmically:

| Token | Default | Variant | Anatomy |
|---|---|---|---|
| `--j-list-h-compact` | `32px` | `lines="compact"` | Dense navigation links, command/menu rows (`13px` text) |
| `--j-list-h-1` | `44px` | `lines="1"` | Single-line item: leading icon/avatar + label + trailing meta/control |
| `--j-list-h-2` | `60px` | `lines="2"` | Two-line item: title + 1-line secondary description |
| `--j-list-h-3` | `76px` | `lines="3"` | Three-line item: title + 2-line preview (inbox, notifications) |

- **Horizontal padding**: `--j-list-px: calc(12px * var(--j-density))`
- **Internal slot gap**: `--j-list-gap: calc(12px * var(--j-density))`
- **Keyline inset divider**: When `inset-divider` is enabled, row dividers start aligned with the text column (indented past the leading icon/avatar slot), reducing visual noise.

### Application Chrome
| Token / Variable | Default | Usage |
|---|---|---|
| `--j-topbar-h` | `52px` | Top application / navigation bar |
| `--j-subbar-h` | `40px` | Secondary filter / breadcrumb / horizontal tab bar (`.j-shell__subbar`) |
| `--j-bottombar-h` | `60px` | Bottom navigation bar or sticky mobile action bar (`+ safe-area-inset-bottom`) |
| `--j-sidebar-w` | `248px` | Expanded left navigation sidebar (`200px` in `three-pane`) |
| `--j-sidebar-rail-w` | `60px` | Collapsed icon-only navigation rail (`.j-shell__rail`) |
| `--j-subnav-w` | `220px` | Contextual secondary navigation column in `dual-nav` |
| `--j-aside-w` | `320px` | Right inspector / detail panel (`.j-shell__aside`) |
| `--j-split-master-w` | `320px` | Master list pane in `split` (`300px` in `three-pane`) |
| `--j-dock-h` | `180px` | Collapsible bottom console / timeline dock (`.j-shell__dock`) |

---

## 4. Content Containers, Measures & Keylines

| Token | Size | Usage |
|---|---|---|
| `--j-measure-prose` | `65ch` | Optimal line length for paragraphs and editorial prose (`72ch` in `DocsLayout` with code blocks) |
| `--j-container-sm` | `640px` | Narrow focused flows: sign-in, onboarding, focused settings |
| `--j-container-md` | `880px` | Standard content page, settings, forms, articles |
| `--j-container-lg` | `1160px` | Standard SaaS workspace, multi-card overview |
| `--j-container-xl` | `1400px` | Data-dense dashboards, wide multi-column grids |
| `--j-page-gutter` | `clamp(16px, 4vw, 40px)` | Horizontal keyline padding from viewport/pane edge |
| `--j-page-py` | `calc(28px * var(--j-density))` | Vertical padding at top and bottom of a page canvas |

### Architectural Grid System (`JGrid` + `JCol` / `.j-grid` + `.j-col`)

The grid system uses **CSS Grid + `@container` queries + CSS Subgrid** instead of legacy Flexbox percentage grids (zero negative-margin hacks, true 2D track alignment):

- **12-Column Grid**: `<JGrid :cols="12">` (or automatic whenever `<JCol>` children are present).
- **Container-Responsive Spans (`@container j-grid`)**: `sm` (`≥ 480px`), `md` (`≥ 720px`), `lg` (`≥ 960px`) adapt to the grid's actual container width inside sidebars, drawers, and split panes; omitting base `span` stacks full-width (`12`) on the narrowest container.
- **Offsets & Row Spans**: `start="1..12"` positions columns without empty spacer `<div>`s; `row-span="1..6"` spans rows.
- **Intrinsic Auto-Grids**: `cols="auto-fit"` (stretch items) and `cols="auto-fill"` (preserve empty tracks) with `minCellWidth`.
- **Independent Axis Gaps & Subgrid**: `colGap` and `rowGap` accept all 6 semantic relationship tokens; `subgrid` aligns nested card headers, bodies, and footers across peer columns; `guides` renders sub-pixel column hairlines.

---

## 5. Window Size Classes (Responsive Breakpoints)

All shells and screen primitives use **CSS Container Queries** (`@container`) rather than `window` media queries alone, so layouts adapt identically whether rendered full-viewport (`100dvh`) or inside split/embedded preview frames.

| Class | Container range | Gutters | Canonical navigation & panes |
|---|---|---|---|
| **Compact** | `< 720px` | `16px` | Single pane · `BottomBar` or off-canvas modal `Sidebar` · `split` drill-down |
| **Medium** | `720px – 1099px` | `24px` | `60px` Icon Rail + fluid Main pane · secondary subnav / TOC / inspector hidden |
| **Expanded** | `1100px – 1439px` | `32px` | Persistent `248px` Sidebar (or `60px + 220px` Dual-Nav) + fluid Main pane |
| **Wide** | `≥ 1440px` | `40px` | Persistent Sidebar + Main pane + `320px` Right Aside / `200px` Docs TOC |

---

## 6. High-Level Application Shells (`JAppShell` / `AppShell` / `.j-shell`)

`JAppShell` supports **4 surface variants** via `variant` (`data-variant`):
- **`flat` (default)**: Edge-to-edge panes separated by crisp `1px` `--j-border` hairlines.
- **`inset`**: Arc / Linear / macOS **Inset Island** — outer chrome sits quietly on `--j-surface-2` while `.j-shell__body` / `.j-shell__workspace` floats as a rounded `--j-surface-1` island (`margin: 8px`, `border-radius: var(--j-radius-lg)`, `box-shadow: 0 0 0 1px var(--j-border), var(--j-shadow-xs)`).
- **`floating`**: **Multi-Island Floating Chrome** — `8px` padded `--j-surface-2` canvas where rails, sidebars, workspace stages, and asides each float as independent rounded `--j-surface-1` islands.
- **`contrast`**: **Obsidian Contrast Chrome** — `color-scheme: dark` high-contrast slate/obsidian navigation chrome (sidebar, rail, subnav, statusbar, global workbench headers) paired with crisp light/dark workspace canvas.

Composable chrome slots & controls across shells include `#banner` (`.j-shell__banner`), `#statusbar` (`.j-shell__statusbar`), `v-model:aside-open` / `asideOpen` (desktop collapse + narrow slide-over right sheet with scrim), `sidebarSide="start | end"`, and `asideWidth`.

And **16 canonical layout archetypes** via `layout` (`data-layout`):
1. **`sidebar`** (default): `248px` left/right `Sidebar` + `TopBar` + scrollable `Main` (`< 720px` off-canvas drawer).
2. **`header-sidebar`**: Full-width global `TopBar` (+ `#banner`) spanning above `[240px Sidebar + 1fr Main]` (*GitHub, AWS, GCP, Jira*).
3. **`dual-nav`**: `60px` primary `#rail` + `220px` contextual `#subnav` + `1fr` main stage (*Slack, Discord, Raycast*).
4. **`adaptive`**: Material 3 Navigation Suite — `BottomBar` (`< 720px`) → `60px` left rail (`720–1099px`) → `248px` full `Sidebar` (`≥ 1100px`).
5. **`workspace` / `studio`**: `Sidebar` + center column (`TopBar` + `Main` + collapsible `#dock`) + `320px` right `#aside` inspector.
6. **`ide`**: Compact `38px` workbench titlebar + `48px` `#rail` + `232px` `#subnav` explorer + `#subbar` tab strip + code canvas + collapsible `#dock` terminal + toggleable `#aside` agent + `24px` `#statusbar` (*VS Code, Cursor, Zed*).
7. **`copilot`**: `224px` `Sidebar` + primary workspace + toggleable `360px` AI Copilot sidecar (`#aside` with `.j-shell__copilot-header/body/footer`) (*Shopify Sidekick, Notion AI, M365 Copilot*).
8. **`split`**: `Sidebar`/rail + `320px` `#master` list + `1fr` detail pane, with `activePane="master | detail"` mobile drill-down below `720px`.
9. **`three-pane`**: `200px` `Sidebar` (`< 1024px` → `60px` rail) + `300px` `#master` list + `1fr` detail pane (*Apple Mail, Linear Triage*).
10. **`holy-grail`**: Full-width `TopBar` → `[220px Sidebar + 1fr Main + 268px Aside]` → full-width `BottomBar` footer (*Docs, Portals, Communities*).
11. **`command-center`**: High-density `44px` ops `TopBar` + `34px` live ticker `#subbar` + `52px` `#rail` + telemetry stage + live stream `#dock` + incident `#aside` + `24px` `#statusbar` (*Datadog, Bloomberg, Grafana*).
12. **`floating-dock`**: Full-bleed dot-grid spatial stage + floating blurred top HUD (`#topbar`) + centered floating pill dock (`#bottombar`) + floating inspector card (`#aside`) (*FigJam, Apple Freeform, visionOS*).
13. **`topnav`**: Horizontal `TopBar` + optional `40px` `#subbar` + fluid/centered `Main` (*Vercel, GitHub Repo*).
14. **`centered`**: `TopBar` + centered scrollable `Main` + optional `BottomBar` (no left chrome).
15. **`focus`**: Whisper-quiet borderless progress `TopBar` + centered `680px` focus/wizard column + pinned bottom action bar (*Stripe Checkout, Onboarding Wizards, iA Writer*).
16. **`bars`**: Sticky `TopBar` + scrollable `Main` + sticky `BottomBar` (`tabs` or `actions`).

---

## 7. The 6 Screen Families & 18 Canonical Screen Architectures

Every digital product screen — from enterprise SaaS and developer studios to mobile consumer apps, knowledge bases, and agentic AI workspaces — belongs to one of **6 structural families** and **18 canonical screen architectures**:

### Family I — Navigation & Application Shells
| # | Architecture | Primitive(s) | Key Dimensions | Scroll Ownership | Responsive Collapse (`@container`) |
|---|---|---|---|---|---|
| 1 | **Standard Sidebar Workspace** | `JAppShell layout="sidebar"` | `248px` nav · `52px` topbar · `1fr` main | Independent scroll on `.j-sidebar__body` & `.j-shell__main` | `< 720px`: sidebar becomes off-canvas modal drawer with scrim |
| 2 | **Inset Island Workspace** | `JAppShell variant="inset"` | `248px` `--j-surface-2` nav · `8px` inset `--j-surface-1` island | `.j-shell__main` scrolls inside clipped rounded island | `< 720px`: nav moves off-canvas; island gains symmetrical `8px` margins |
| 3 | **Dual-Rail Contextual App** | `JAppShell layout="dual-nav"` | `60px` `#rail` + `220px` `#subnav` + `1fr` stage | Rail, subnav, and main stage each scroll independently | `< 900px`: `#subnav` hides (`60px` rail remains); `< 720px`: cohesive `280px` off-canvas drawer |
| 4 | **TopNav + SubBar Portal** | `JAppShell layout="topnav"` | `52px` `#topbar` + `40px` `#subbar` + `--j-container-lg` | Vertical scroll on `.j-shell__main`; horizontal overflow on `#subbar` | `< 640px`: gutters tighten to `16px`; subbar pills scroll horizontally |
| 5 | **Adaptive Navigation Suite** | `JAppShell layout="adaptive"` | `248px` (`≥ 1100px`) · `60px` (`720–1099px`) · `60px` bottom (`< 720px`) | `.j-shell__main` owns vertical scroll across all 3 tiers | `≥ 1100px` Sidebar → `720–1099px` Icon Rail → `< 720px` BottomBar |
| 6 | **Mobile Top + Bottom Bars** | `JAppShell layout="bars"` | `52px` sticky TopBar · `1fr` main · `60px` sticky BottomBar | `.j-shell__main` scrolls between pinned top & bottom chrome | Scales from `320px` mobile up to centered `640px` consumer feed |

### Family II — Multi-Pane Triage & Collection Views
| # | Architecture | Primitive(s) | Key Dimensions | Scroll Ownership | Responsive Collapse (`@container`) |
|---|---|---|---|---|---|
| 7 | **Master–Detail Split** | `JAppShell layout="split"` | `60px` rail · `320px` `#master` · `1fr` detail | Independent scroll on `.j-shell__master` & `.j-shell__detail` | `< 720px`: `activePane="master\|detail"` drills into 1 pane at a time (`.j-shell__back` shown) |
| 8 | **Three-Pane Mail / Issues** | `JAppShell layout="three-pane"` | `200px` nav · `300px` `#master` · `1fr` detail | 3 independent vertical scroll regions (nav, master, detail) | `< 1024px`: `200px` nav → `60px` rail; `< 720px`: nav off-canvas + master/detail drill-down |
| 9 | **Dense Collection Explorer** | `JAppShell` + `#subbar` + `JList lines="compact"` | `40px` filter subbar · `--j-container-xl` (`1400px`) · `32px` rows | `.j-shell__main` scrolls rows beneath sticky `#topbar` + `#subbar` | `< 960px`: optional `#aside` row-preview drawer hides |

### Family III — Analytical Dashboards & Operational Workflows
| # | Architecture | Primitive(s) | Key Dimensions | Scroll Ownership | Responsive Collapse (`@container`) |
|---|---|---|---|---|---|
| 10 | **12-Column Bento Dashboard** | `JBento` + `JBentoCell` | `12` cols · `24px` (`group`) gap · `span="3\|4\|6\|8\|12"` · `rowSpan="2"` | Parent `.j-shell__main` / `JPage` owns vertical scroll | `< 900px`: `3\|4 → 6` cols, `8\|9 → 12` cols; `< 560px`: all cells stack at `12` cols |
| 11 | **Kanban / Swimlane Board** | `JBoard` + `JBoardColumn` | `296px` fixed columns · `16px` (`field`) track gap · `8px` card gap | `.j-board` scrolls horizontally; each `.j-board__body` scrolls vertically beneath sticky `.j-board__header` | Columns preserve `296px` readable width and pan horizontally with momentum |

### Family IV — Editorial, Knowledge & Focused Flows
| # | Architecture | Primitive(s) | Key Dimensions | Scroll Ownership | Responsive Collapse (`@container`) |
|---|---|---|---|---|---|
| 12 | **3-Column Documentation** | `JDocsLayout` | `232px` `#nav` · `72ch` prose · `200px` `#toc` | Document scrolls; `#nav` and `#toc` stick (`position: sticky; top: 0`) with internal overflow | `< 1080px`: right `#toc` hides; `< 760px`: left `#nav` collapses, leaving centered `72ch` prose |
| 13 | **Centered Reader / Essay** | `JAppShell layout="centered"` + `JContainer size="prose"` | `52px` translucent TopBar · `65ch` measure | Single calm vertical scroll stream | Fluid margins collapse cleanly down to `16px` `--j-page-gutter` |
| 14 | **Split Auth / Onboarding** | `JAuthSplit` | `clamp(320px, 46%, 460px)` form (`380px` inner) + `1fr` `#showcase` | Form column & showcase scroll independently if taller than viewport | `< 840px`: `#showcase` hides (or stacks below when `stackShowcase` is set); form centers `100%` |
| 15 | **2-Column Split Settings** | `JPage size="md"` + `JSection layout="split"` | `880px` page · `260px` section title column + `1fr` control cards | `.j-shell__main` scrolls; optional sticky `BottomBar variant="actions"` | `< 640px`: `260px + 1fr` section grid stacks cleanly into a single column |

### Family V — Studio, IDE & Spatial Canvases
| # | Architecture | Primitive(s) | Key Dimensions | Scroll Ownership | Responsive Collapse (`@container`) |
|---|---|---|---|---|---|
| 16 | **Multi-Dock Studio / IDE** | `JAppShell layout="studio"` + `#dock` + `#aside` | `60px` rail · `1fr` stage · `180px` `#dock` · `320px` `#aside` | Independent scroll on stage, bottom `#dock`, and full-height `#aside` | `< 960px`: `#aside` hides; `#dock` toggles cleanly via `v-model:dockOpen` |
| 17 | **Infinite Spatial Canvas** | `JCanvasStage` | `100%` dot/line stage · `blur(12px)` `#top`, `#tools`, `#inspector` (`272px`), `#hud` | Viewport owns 2D pan/zoom (`overflow: hidden`); `#inspector` scrolls internally | `< 760px`: floating `#inspector` & `#hud` hide unless `inspectorOpen` is toggled |

### Family VI — Agentic & Conversational Interfaces
| # | Architecture | Primitive(s) | Key Dimensions | Scroll Ownership | Responsive Collapse (`@container`) |
|---|---|---|---|---|---|
| 18 | **AI Thread + Live Artifact** | `JAiCanvas` | Closed: `760px` centered thread · Open: `420px` left thread + `1fr` inset `#artifact` stage | `.j-ai-canvas__messages` scrolls above pinned `.j-ai-canvas__composer`; `.j-ai-canvas__stage-body` scrolls independently | `300ms --j-ease-emphasized` glide when `artifactOpen` toggles; `< 760px`: artifact overlays full frame |
