# Components

Status: ⬜ planned · 🟨 draft · 🟦 review · ✅ stable
Spatial & screen architecture rules live in [LAYOUT.md](./LAYOUT.md).

## Layout
| Component | Status | Notes |
|---|---|---|
| App Shell | ✅ | 16 archetypes (`sidebar`, `header-sidebar`, `dual-nav`, `adaptive`, `workspace`/`studio`, `ide`, `copilot`, `split`, `three-pane`, `holy-grail`, `command-center`, `floating-dock`, `topnav`, `centered`, `focus`, `bars`) × 4 variants (`flat`, `inset`, `floating`, `contrast`); `#banner`, `#statusbar`, `v-model:aside-open`, `sidebarSide` |
| Page & Section | ✅ | `Page` (`stickyHeader`), `PageHeader` (`sticky` via `IntersectionObserver` sentinel), `Section` (`stacked` & 2-col `split`), `Container` (`sm`–`xl`, `prose`) |
| Navigation Bars | ✅ | `Sidebar` (persistent & `60px` rail), `TopBar` (sticky/translucent), `BottomBar` (`tabs` & `actions`) |
| Sidebar Layout | ✅ | `SidebarLayout` + context `SidebarToggle` (`open` / `rail` / `hidden`, container-relative resizable width, `storageKey` persistence, edge hover chevron + right-click edge menu) |
| Grid System | ✅ | `Grid` + `Col` (`GridItem`): 12-col `@container` spans (`sm`/`md`/`lg`), `start` offsets, `auto-fit`/`auto-fill`, `colGap`/`rowGap`, `subgrid` |
| Stack & Inline | ✅ | 1D Flexbox `Stack` & `Inline` with semantic relationship gaps (`inline`, `related`, `item`, `field`, `group`, `section`) |
| List | ✅ | canonical row heights (`compact` 32, `1`-line 44, `2`-line 60, `3`-line 76), keyline inset dividers |
| Scroll Area | ✅ | refined thin scrollbars + dynamic scroll-edge fade masks + overflow-aware `overscroll="dynamic | contain | auto"` wheel chaining |
| Bento & Kanban Board | ✅ | 12-col responsive `Bento` grid + horizontal swimlane `Board` |
| Docs, Auth & AI Canvas | ✅ | 3-col `DocsLayout`, `AuthSplit`, `AiCanvas` (thread + artifact stage), `CanvasStage` |
| Resizable Panels & Split Handle | ✅ | `ResizableGroup` + standalone `.j-resize-handle` & headless `SplitHandle` (`pointerCapture`, cursor lock, keyboard arrows) |
| Toolbar & Status Bar | ✅ | WAI-ARIA roving-focus `Toolbar` (`ToolbarGroup`, `ToolbarSeparator`, `ToolbarSpacer`) + `StatusBar` (`size="sm|md|lg"`, `height` / `--j-statusbar-h`, `textSize="xs|sm"`, `mono`, `StatusBarItem`, `StatusBarSeparator`) |

## Forms
| Component | Status | Notes |
|---|---|---|
| Button | ✅ | `solid`, `soft`, `outline`, `ghost`, `link`; `ButtonGroup`, `SplitButton`, icon-only, loading |
| Toggle | ✅ | `Toggle` & single/multiple `ToggleGroup` (`outline`, `soft`, `ghost`) |
| Segmented Control | ✅ | radiogroup capsule with `300ms` damped gliding indicator |
| Field | ✅ | `Field` + `Label` + hint + accessible validation error |
| Input | ✅ | prefix/suffix adornments (`j-input-group`), `clearable` button, sizes, invalid, read-only |
| Textarea | ✅ | auto-growing (`field-sizing: content`) |
| Number Input | ✅ | tabular-numerals stepper (`end` & `split` controls), units, keyboard step |
| Pin Input | ✅ | multi-cell verification/OTP input with paste distribution & group separator |
| Tag Input | ✅ | inline chip entry with keyboard commit/remove & max-tag guard |
| Select | ✅ | native `<select>` progressively enhanced with `base-select` + `clearable` (`emptyValue`, `clearLabel`, `clearTooltip`) |
| Checkbox | ✅ | custom-drawn native checkbox + indeterminate |
| Radio | ✅ | `Radio` & `RadioGroup` (`vertical` / `horizontal`) |
| Switch | ✅ | architectural capsule with `300ms` zero-bounce thumb glide |
| Slider | ✅ | filled-track native `<input type=range>` |
| File Upload | ✅ | drag-and-drop `dropzone` & `compact` uploader with size validation |
| Date Picker / Calendar | ✅ | single date & date-range calendar popover + day activity dots (`markers` & `#day` / `renderDay`) |
| Time Picker | ✅ | keyboard-friendly hour/minute/period field |
| Color Picker | ✅ | OKLCH / HEX / RGB swatch & spectrum picker |
| Rich Text Editor | ✅ | composable formatting toolbar & prose surface |

## Display
| Component | Status | Notes |
|---|---|---|
| Icon & Registry | ✅ | `Icon` component + `130+` built-in `24×24` optical stroke icons + automatic `.j-icon` child sizing + `--j-icon-scale` + pluggable app icon registry (`registerIcons`, `provideIcons` / `IconProvider`) |
| Badge | ✅ | `soft`, `solid`, `outline`, status dot, `removable` (`×`), deterministic 12-hue OKLCH `autoColor` / `colorSeed` |
| Avatar | ✅ | `Avatar` (image, initials fallback, status, deterministic 12-hue OKLCH `autoColor` / `colorSeed`) & overlapping `AvatarGroup` |
| Card | ✅ | `surface`, `outline`, `ghost`, `elevated`, `flush` edge-to-edge body, interactive states |
| Accordion | ✅ | `Accordion` & `Collapsible` on native `<details>` with `300ms` height glide |
| Alert | ✅ | `soft` & `outline` callouts across all status tones |
| Banner | ✅ | `Banner` top-of-shell `flush` & inline dismissible announcement bars |
| Empty State | ✅ | `surface`, `dashed`, and `ghost` zero-data placeholders |
| Breadcrumb | ✅ | `chevron` & `slash` hierarchy trails with middle ellipsis |
| Pagination | ✅ | windowed page bar + `simple` summary mode |
| Progress | ✅ | determinate, calm indeterminate, stacked `segments`, and discrete `steps` progress bar |
| Progress Ring | ✅ | `ProgressRing` circular determinate & indeterminate vector gauge |
| Sparkline | ✅ | zero-dependency SVG micro-chart (`line`, `area`, `bar`) with monotone cubic smoothing, min/max & end dots |
| Stat & Metric | ✅ | `Stat` & `StatGroup` KPI readouts with tabular numerals, trend badges, and sparkline slot |
| Spinner | ✅ | high-definition SVG vector `ring`, `arc`, and `dots` indicators |
| Skeleton | ✅ | low-contrast shimmer (`rect`, `text`, `circle`, `lines`) |
| Kbd | ✅ | architectural keycap |
| Separator | ✅ | horizontal/vertical hairline rule with optional centered label |
| Code Block & Copy | ✅ | `CodeBlock` `--j-syntax-*` highlighter with line numbers & diff mode + `CopyButton` |
| Description List | ✅ | `DescriptionList` & `DescriptionItem` `horizontal`, `stacked`, and `@container` `grid` key-value inspector |
| Timeline | ✅ | `Timeline` & `TimelineItem` chronological activity, audit & agent step feed |
| Table / Data Table | ✅ | sticky headers, collapsible `TableSection` groups (`v-model:expanded-sections`, roving focus skip), sorting, selection, tabular numerals, pagination |
| Virtual List | ✅ | `createVirtualizer` + `VirtualList` for 50k+ rows (O(1) fixed height & `ResizeObserver` variable height) |
| Data Grid | ✅ | virtualized dense `role="grid"` with pinned `left`/`right` columns, column resize, single & `Shift+Click` multi-sort, search, `Shift`-range multi-select, 2D keyboard navigation, row context menu |
| Stepper | ✅ | horizontal & vertical multi-step progress indicator |
| Tree View | ✅ | collapsible hierarchical file/navigation tree with keyboard roving focus & async `lazy` / `loadChildren` expansion |
| Carousel | ✅ | CSS scroll-snap gallery with previous/next & indicator controls |

## Overlay
| Component | Status | Notes |
|---|---|---|
| Tooltip | ✅ | `popover="manual"` + CSS anchor positioning + instant warm handoff |
| Hover Card | ✅ | delayed rich preview card with pointer bridge |
| Popover | ✅ | anchored floating panel with light-dismiss |
| Dropdown Menu | ✅ | WAI-ARIA menu with roving arrows, cascading `DropdownSub` submenus, typeahead, check/radio items, shortcuts |
| Context Menu | ✅ | right-click / `Shift+F10` coordinate-anchored menu, cascading `DropdownSub` submenus, ancestor-only scroll close, imperative `openAt` / `openFor` / `openFromEvent` |
| Menubar | ✅ | `Menubar` & `MenubarMenu` desktop/IDE `role="menubar"` with hover handoff & cascading submenus |
| Combobox | ✅ | searchable autocomplete (`single` & `multiple`) with `allowCustomValue` free-text, `creatable` row, async `loading` + `debounce` + `filter={false}`, and `aria-activedescendant` |
| Dialog | ✅ | native modal `<dialog>` (`sm`–`lg`, `flush` body, `<JButton default>` / `defaultAction` on `Enter`, mobile bottom sheet adaptation, default `<body>` teleport/portal) |
| Alert Dialog | ✅ | `AlertDialog` `role="alertdialog"` confirmation modal with backdrop guard & safe focus |
| Drawer | ✅ | native `<dialog>` side/top/bottom sheet + `flush` body + floating `inset` variant + default `<body>` teleport/portal |
| Toast | ✅ | top-layer `Toaster` deck with hover fan-out, `toast.loading` / `toast.update`, and verified `toast.promise` / `toast.fromResult` |
| Tabs | ✅ | `underline` & `pill` variants, horizontal/vertical, FLIP indicator |
| Document Tabs | ✅ | IDE/notebook/browser `DocTabs` with `×` & middle-click close, `#tab` (`{ tab, active, index, closable, close }`) & `#label` slots with preserved tail, `dirty` dot, `pinned` tabs, wheel scroll, overflow menu, drag-to-reorder, `+` add action |
| Chrome Tab Strip | ✅ | `TabStrip` (`pinned`, `preview` italic, `dirty`, `loading` spinner, `indicator` dot, `description` hover card, `pointerdown` activate, middle-click close, drag `@reorder`, `@detach`, `:search="true"` filter popover, `#context-menu`, `:titlebar="true"` `y=0` top-edge hit area, `--j-tab-strip-active-bg`) |
| Command Palette | ✅ | modal `⌘K` action & navigation launcher |
| Theme API & Shortcuts | ✅ | JS theme color resolvers (`getThemeTokens`, `getChartPalette`, `getSyntaxTheme`, `getTerminalTheme`, `onThemeChange`) + visibility- & tab-aware `createShortcutRegistry` / `useShortcut` |
