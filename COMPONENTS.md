# Components

Status: ⬜ planned · 🟨 draft · 🟦 review · ✅ stable
Spatial & screen architecture rules live in [LAYOUT.md](./LAYOUT.md).

## Layout
| Component | Status | Notes |
|---|---|---|
| App Shell | 🟨 | 16 archetypes (`sidebar`, `header-sidebar`, `dual-nav`, `adaptive`, `workspace`/`studio`, `ide`, `copilot`, `split`, `three-pane`, `holy-grail`, `command-center`, `floating-dock`, `topnav`, `centered`, `focus`, `bars`) × 4 variants (`flat`, `inset`, `floating`, `contrast`); `#banner`, `#statusbar`, `v-model:aside-open`, `sidebarSide` |
| Page & Section | 🟨 | `Page`, `PageHeader`, `Section` (`stacked` & 2-col `split`), `Container` (`sm`–`xl`, `prose`) |
| Navigation Bars | 🟨 | `Sidebar` (persistent & `60px` rail), `TopBar` (sticky/translucent), `BottomBar` (`tabs` & `actions`) |
| Grid System | 🟨 | `Grid` + `Col` (`GridItem`): 12-col `@container` spans (`sm`/`md`/`lg`), `start` offsets, `auto-fit`/`auto-fill`, `colGap`/`rowGap`, `subgrid` |
| Stack & Inline | 🟨 | 1D Flexbox `Stack` & `Inline` with semantic relationship gaps (`inline`, `related`, `item`, `field`, `group`, `section`) |
| List | 🟨 | canonical row heights (`compact` 32, `1`-line 44, `2`-line 60, `3`-line 76), keyline inset dividers |
| Scroll Area | 🟨 | refined thin scrollbars + dynamic scroll-edge fade masks |
| Bento & Kanban Board | 🟨 | 12-col responsive `Bento` grid + horizontal swimlane `Board` |
| Docs, Auth & AI Canvas | 🟨 | 3-col `DocsLayout`, `AuthSplit`, `AiCanvas` (thread + artifact stage), `CanvasStage` |
| Resizable Panels | 🟨 | draggable splitters with keyboard resize & persisted ratios |

## Forms
| Component | Status | Notes |
|---|---|---|
| Button | 🟨 | `solid`, `soft`, `outline`, `ghost`, `link`; `ButtonGroup`, icon-only, loading |
| Toggle | 🟨 | `Toggle` & single/multiple `ToggleGroup` (`outline`, `soft`, `ghost`) |
| Segmented Control | 🟨 | radiogroup capsule with `300ms` damped gliding indicator |
| Field | 🟨 | `Field` + `Label` + hint + accessible validation error |
| Input | 🟨 | prefix/suffix adornments (`j-input-group`), sizes, invalid, read-only |
| Textarea | 🟨 | auto-growing (`field-sizing: content`) |
| Number Input | 🟨 | tabular-numerals stepper (`end` & `split` controls), units, keyboard step |
| Pin Input | 🟨 | multi-cell verification/OTP input with paste distribution & group separator |
| Tag Input | 🟨 | inline chip entry with keyboard commit/remove & max-tag guard |
| Select | 🟨 | native `<select>` progressively enhanced with customizable `base-select` |
| Checkbox | 🟨 | custom-drawn native checkbox + indeterminate |
| Radio | 🟨 | `Radio` & `RadioGroup` (`vertical` / `horizontal`) |
| Switch | 🟨 | architectural capsule with `300ms` zero-bounce thumb glide |
| Slider | 🟨 | filled-track native `<input type=range>` |
| File Upload | 🟨 | drag-and-drop `dropzone` & `compact` uploader with size validation |
| Date Picker / Calendar | 🟨 | single date & date-range calendar popover |
| Time Picker | 🟨 | keyboard-friendly hour/minute/period field |
| Color Picker | 🟨 | OKLCH / HEX / RGB swatch & spectrum picker |
| Rich Text Editor | 🟨 | composable formatting toolbar & prose surface |

## Display
| Component | Status | Notes |
|---|---|---|
| Badge | 🟨 | `soft`, `solid`, `outline`, status dot |
| Avatar | 🟨 | `Avatar` (image, initials fallback, status) & overlapping `AvatarGroup` |
| Card | 🟨 | `surface`, `outline`, `ghost`, `elevated`, interactive states |
| Accordion | 🟨 | `Accordion` & `Collapsible` on native `<details>` with `300ms` height glide |
| Alert | 🟨 | `soft` & `outline` callouts across all status tones |
| Empty State | 🟨 | `surface`, `dashed`, and `ghost` zero-data placeholders |
| Breadcrumb | 🟨 | `chevron` & `slash` hierarchy trails with middle ellipsis |
| Pagination | 🟨 | windowed page bar + `simple` summary mode |
| Progress | 🟨 | determinate & calm indeterminate `<progress>` |
| Spinner | 🟨 | pure-CSS `currentColor` loading ring |
| Skeleton | 🟨 | low-contrast shimmer (`rect`, `text`, `circle`, `lines`) |
| Kbd | 🟨 | architectural keycap |
| Separator | 🟨 | horizontal/vertical hairline rule with optional centered label |
| Table / Data Table | 🟨 | sticky headers, sorting, selection, tabular numerals, pagination |
| Stepper | 🟨 | horizontal & vertical multi-step progress indicator |
| Tree View | 🟨 | collapsible hierarchical file/navigation tree with keyboard roving focus |
| Carousel | 🟨 | CSS scroll-snap gallery with previous/next & indicator controls |

## Overlay
| Component | Status | Notes |
|---|---|---|
| Tooltip | 🟨 | `popover="manual"` + CSS anchor positioning + instant warm handoff |
| Hover Card | 🟨 | delayed rich preview card with pointer bridge |
| Popover | 🟨 | anchored floating panel with light-dismiss |
| Dropdown Menu | 🟨 | WAI-ARIA menu with roving arrows, typeahead, check/radio items, shortcuts |
| Context Menu | 🟨 | right-click / `Shift+F10` coordinate-anchored menu |
| Combobox | 🟨 | searchable autocomplete (`single` & `multiple`) with `aria-activedescendant` |
| Dialog | 🟨 | native modal `<dialog>` (`sm`–`lg`, mobile bottom sheet adaptation) |
| Drawer | 🟨 | native `<dialog>` side/top/bottom sheet + floating `inset` variant |
| Toast | 🟨 | top-layer `Toaster` deck with hover fan-out & `toast()` API |
| Tabs | 🟨 | `underline` & `pill` variants, horizontal/vertical, FLIP indicator |
| Command Palette | 🟨 | modal `⌘K` action & navigation launcher |
