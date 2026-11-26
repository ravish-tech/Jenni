# Changelog

All notable changes to `jenni-core`, `jenni-vue`, and `jenni-react` are documented in this file.

## [0.4.0] — 2026-11-25

### Added — Desktop & Workbench Enhancements (`#1`–`#11`)
- **Item #1 — `JIcon` Child Sizing & `--j-icon-scale` (`button`, `toggle`, `badge`, `breadcrumb`, `pagination`, `empty-state`, `combobox`, `statusbar`)**: Direct `.j-icon:not([data-size])` children now automatically inherit component icon dimensions alongside `> svg`; bumped `JButton` / `JToggle` `--_icon` sizes (`sm: 16px`, `md: 18px`, `lg: 20px`) and added `--j-icon-scale` (default `1`) for padded icon fonts.
- **Item #2 — Popover Exit Transition Layout Stability**: Moved `flex-direction: column` (and inline-flex layout rules) onto base popover selectors across `menu.css`, `combobox.css`, `time-picker.css`, `tooltip.css`, and `menubar.css` so items never flip into a row during `allow-discrete` exit fades.
- **Item #3 — Chrome-Style Tab Strip (`JTabStrip` / `TabStrip`, `createTabStrip`)**: Full window title-bar & document tab strip with icon, title, close button, `pinned`, `preview` (italic), `dirty` marker, `loading` spinner, `indicator` dot, `description` hover card, activate on `pointerdown`, middle-click close, `@dblclick`, drag reorder (`@reorder`), drag-out detach (`@detach`), scroll fades + `+` (`@new`), `:search="true"` filter dropdown with inline close buttons, built-in + `#context-menu` actions, roving `tabindex`, `:titlebar="true"` top-edge (`y=0`) hit boxes (`--j-tab-strip-gap` / `--ct-gap`), and `--j-tab-strip-active-bg`.
- **Item #4 — Resizable & Collapsible Sidebar Layout (`JSidebarLayout` + `JSidebarToggle` / `SidebarLayout` + `SidebarToggle`)**: Full-height view layout with `open | rail | hidden` states (`rail` when `#rail` exists), container-relative drag width (`clientX - layoutRect.left`, `defaultWidth=260`, `min=180`, `max=600`), `storageKey` persistence, edge hover toggle, right-click edge menu (`Show / Rail / Hide`), and context-wired `<JSidebarToggle />` (`dock-left` icon + dynamic tooltip).
- **Item #5 — Reusable `.j-resize-handle` & Headless `JSplitHandle` / `SplitHandle` (`createSplitHandle`)**: Standalone pointer-captured splitter primitive (`horizontal` / `vertical`, `withGrip`, `@drag-start`, `@drag`, `@drag-end`, keyboard arrows with `step` / `largeStep`, cursor & `user-select` lock).
- **Item #6 — Dynamic `JScrollArea` / `ScrollArea` Overscroll Containment**: `ResizeObserver`-driven `data-overflows-y` / `data-overflows-x` applies `overscroll-behavior: contain` only on axes that actually overflow (`overscroll="dynamic | contain | auto"`), preventing swallowed wheel events on short content.
- **Item #7 — Clearable Native `JSelect` / `Select`**: Added `clearable`, `emptyValue = ''`, `clearLabel = 'Clear'`, and `clearTooltip` while keeping a real `<select>` element.
- **Item #8 — `JDialog` / `Dialog` Default Action on `Enter`**: Added `default` prop on `JButton` / `Button` inside `#footer` and `defaultAction` prop on `JDialog` / `Dialog` (`bindDialogDefaultAction`), focusing the primary action on open and firing on `Enter` safely outside textareas, selects, other buttons, `Shift+Enter`, and IME composition.
- **Item #9 — Sticky `JPageHeader` / `PageHeader` (`sticky` & `JPage` `stickyHeader`)**: `IntersectionObserver` sentinel sticks headers to the nearest scroll container with `--j-bg` and reveals `--j-border` only while `[data-stuck]`.
- **Item #10 — Collapsible Table Sections (`JTableSection` / `TableSection`)**: Grouped `<tbody>` sections inside `JTable` / `Table` with `aria-expanded` chevron headers, `v-model:expanded-sections`, keyboard roving focus skipping collapsed rows, and `expandAll()` / `collapseAll()` helpers.
- **Item #11 — `JStatusBar` / `StatusBar` Height, Text Size & Monospace Props**: Added `--j-statusbar-h`, `size="sm | md | lg"` (`lg` = `30px` density-scaled), `height` override, tokenized `--j-text-xs` default (`textSize="xs | sm"`), and `mono` prop.

### Added — High-Definition Vector Icons, Spinners & 8 Flagship Components
- **HD `24×24` Precision Icon Engine (`130+` icons)**: Upgraded `BUILTIN_ICONS` to `24×24` `geometricPrecision` paths with size-calibrated optical stroke weights (`xs: 2` → `xl: 1.5`).
- **HD Vector Spinners & `JProgressRing` / `ProgressRing`**: Upgraded `JSpinner` / `Spinner` and all inline loading indicators (`Button`, `Toast`, `Combobox`, `TreeView`, `Alert`) to crisp SVG `stroke-linecap="round"` vector arcs, plus determinate/indeterminate circular `ProgressRing`.
- **New Display & Overlay Primitives**: Added `JStat` / `JStatGroup` (`Stat` / `StatGroup`), `JTimeline` / `JTimelineItem` (`Timeline` / `TimelineItem`), `JDescriptionList` / `JDescriptionItem` (`DescriptionList` / `DescriptionItem`), `JBanner` / `Banner`, `JCodeBlock` + `JCopyButton` (`CodeBlock` + `CopyButton`), `JAlertDialog` / `AlertDialog`, and `JMenubar` / `JMenubarMenu` (`Menubar` / `MenubarMenu`).

## [0.3.0] — 2026-11-20

### Added
- **Sparkline Micro-Chart (`JSparkline` / `Sparkline`, `computeSparkline`)**: Zero-dependency inline SVG micro-chart (`line`, `area`, `bar`) with overshoot-free Fritsch–Carlson monotone cubic smoothing, min/max & end dots, semantic tones, and `--j-chart-1..8` support.
- **Split Button (`JSplitButton` / `SplitButton`)**: Primary action button paired with an attached WAI-ARIA dropdown menu trigger across `solid`, `soft`, and `outline` variants.
- **Cascading Submenus (`JDropdownSub` / `DropdownSub`, `createSubmenu`)**: Multi-level nested submenus inside both `DropdownMenu` and `ContextMenu` with hover grace timers, `ArrowRight`/`ArrowLeft`/`Escape` keyboard navigation, and viewport edge flipping.
- **Lazy Tree Children (`JTreeView` / `TreeView`)**: Async `lazy` / `hasChildren` + `loadChildren(node)` expansion with inline `.j-tree__spinner`, `aria-busy`, concurrency deduplication, and empty-folder chevron retirement.
- **Combobox Free Text & Async Search (`JCombobox` / `Combobox`)**: `allowCustomValue` (`freeSolo`), `creatable` (`+ Create "…"`), `loading` spinner, `:filter="false"` server-side mode, `debounce`, and `v-model:search` / `@search` (`searchValue` / `onSearch`).
- **Clearable Input (`JInput` / `Input`)**: `clearable` prop + `@clear` / `onClear` with zero layout shift inside `.j-input-group`.
- **Flush Card, Dialog & Drawer Bodies**: `flush` (`bodyFlush`) prop on `Card`, `Dialog`, and `Drawer` removing body padding for edge-to-edge grids, lists, editors, and terminals.
- **Removable Badge (`JBadge` / `Badge`)**: `removable` (`closable`) prop + `@remove` / `onRemove`.
- **Status-Bar Separators (`JStatusBarSeparator` / `StatusBarSeparator`)**: Crisp vertical dividers + `separator` prop on `StatusBarItem`.
- **Document Tabs Custom Slot Ergonomics (`JDocTabs` / `DocTabs`)**: `#tab` / `renderTab` now receives `{ tab, active, index, closable, close }`, preserves the trailing `dirty` dot + `×` close button automatically (unless `hideTabTail` is set), and adds `#label` / `renderLabel`.

### Fixed
- **TypeScript Subpath Resolution for `jenni-core/behaviors/*.js`**: Added explicit `"./behaviors/*.js"` export mapping to `"./dist/behaviors/*.d.ts"` in `jenni-core/package.json` so consumers need zero manual `.d.ts` shims.

## [0.2.0] — 2026-11-20

### Bug Fixes
- **Context Menu Scroll Isolation (`R01`)**: Fixed `context-menu.js` closing open menus when unrelated scrollable containers (such as streaming terminals or log panes) scrolled. Open context menus now close only when an ancestor of the trigger/anchor or the document viewport scrolls.

### Added — Priority 1
- **Imperative & Keyboard Context Menu API (`R02`)**: Headless/shared context menu support (`openAt(x, y, opts)`, `openFor(anchorEl, opts)`, `openFromEvent(event)`) with automatic focus entry and Escape focus restoration across `jenni-core`, `JContextMenu`, and `ContextMenu`.
- **Body Teleport / Portal on Dialogs & Drawers (`R03`)**: `JDialog`, `JDrawer`, `Dialog`, and `Drawer` now default `teleport = true` (`<body>`), eliminating ancestor style/event leakage and hidden-tab clipping while preserving `teleport={false}` for inline rendering.
- **Icon System & Pluggable Registry (`R04`)**: Added `JIcon` / `Icon`, `provideIcons` / `IconProvider`, and `registerIcons(mapOrResolver)` in `jenni-core` with 48+ built-in 16×16 stroke icons and seamless integration with custom/third-party icon libraries.
- **Virtual Scrolling (`R05`)**: Added `JVirtualList` / `VirtualList` (`createVirtualizer`) supporting both fixed `O(1)` row heights and dynamic `ResizeObserver` variable-height rows with `scrollToIndex` and `scrollToOffset`.
- **High-Density Data Grid (`R06`)**: Added `JDataGrid` / `DataGrid` with virtualized scrolling, resizable & pinned (`left`/`right`) columns, single & Shift+Click multi-column sorting, inline search, multi-row Shift-range selection, WAI-ARIA `role="grid"` 2D keyboard navigation, and `@row-contextmenu` integration.
- **Workbench Document Tabs (`R07`)**: Added `JDocTabs` / `DocTabs` with closable (`×` + middle-click), `dirty` indicator dots, `pinned` tabs, wheel horizontal scrolling, overflow menu popover, drag-to-reorder, `+` add action, and `@tab-contextmenu`.
- **JS Theme Color Engine + Chart, Syntax & Terminal Tokens (`R08`)**: Added `--j-chart-1..8`, `--j-code-*` / `--j-syntax-*`, and 16-color `--j-ansi-*` / `--j-term-*` OKLCH tokens plus `getThemeTokens()`, `getTerminalTheme()` (`xterm.js` `ITheme`), `getSyntaxTheme()`, `getChartPalette()`, `resolveCssColor()`, `onThemeChange()`, and Vue/React `useThemeTokens()`.

### Added — Priority 2
- **Standalone Status Bar & Action Toolbar**: Added `JStatusBar` / `JStatusBarItem` (`StatusBar` / `StatusBarItem`) and WAI-ARIA roving-focus `JToolbar` / `JToolbarGroup` / `JToolbarSeparator` (`Toolbar`).
- **Calendar Day Activity Dots**: Added `markers` prop and `#day` / `renderDay` customization on `JCalendar` and `JDatePicker` (`Calendar` / `DatePicker`).
- **Deterministic Per-Author / Entity Colors**: Added perceptual 12-hue OKLCH `colorSeed` / `autoColor` hashing (`getEntityHue`, `getEntityColorVars`) on `JAvatar` / `Avatar` and `JBadge` / `Badge`.
- **Segmented & Stepped Progress Bar**: Added multi-segment `segments` and discrete `steps` modes on `JProgress` / `Progress`.

### Added — Priority 3
- **Verified Action Toasts**: Added `toast.loading`, `toast.update`, `toast.promise(fn, { loading, success, error, verify })`, and `toast.fromResult(result)` so unverified or `{ ok: false }` operations never display false success toasts.
- **Visibility-Aware Shortcut Registry**: Added `createShortcutRegistry`, `registerShortcut`, `formatShortcut`, and Vue/React `useShortcut` / `useShortcuts` that automatically ignore shortcuts inside hidden tabs, `inert`/`[hidden]` subtrees, background panes behind modal `<dialog>`, and terminal inputs.
- **Machine-Readable Component API Manifest**: Added AST-generated `COMPONENT_MANIFEST.json` (`jenni-core/manifest.json`, `jenni-vue/manifest.json`, `jenni-react/manifest.json`) documenting every component, prop, model, event, slot, exposed handle, token, and CSS import.
- **Granular Per-Component Minified CSS**: Added `jenni-core/css/foundation.css` (design tokens + base reset) and modular `jenni-core/css/<slug>.css` component bundles (pair `jenni-core/css/foundation.css` with any `jenni-core/css/<slug>.css` imports) alongside minified `dist/jenni.css`.
- **Synchronized Release Versioning**: Added `scripts/version.mjs` (`npm run version:bump`) keeping workspace versions and peer dependencies aligned.

## [0.1.0] — 2026-11-18
- Initial public release of `jenni-core`, `jenni-vue`, and `jenni-react` (57 components, 16 container-query app shells × 4 surface variants, `0.65×–1.15×` continuous density, and 3-tier benchmark suite).
