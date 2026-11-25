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

- **Application Chrome:** Use `JAppShell` / `AppShell` (`16` layouts: `sidebar`, `header-sidebar`, `ide`, `workspace`, `copilot`, `split`, `three-pane`, `command-center`, etc. × `4` variants: `flat`, `inset`, `floating`, `contrast`) paired with `JToolbar`/`Toolbar` (`JToolbarSpacer`) and `JStatusBar`/`StatusBar` (`JStatusBarSeparator`, `#statusbar` slot).
- **Navigation vs. Open Documents:** Use `JTabs` / `Tabs` (`underline` | `pill`) for static view switching; use `JDocTabs` / `DocTabs` for closable, pinnable, reorderable IDE/notebook/browser document strips (`#tab="{ tab, active, index, closable, close }"` preserves the trailing `dirty` dot + `×` close button automatically unless `hideTabTail` is set).
- **Tables, Grids, Trees & Micro-Charts:**
  - `< 200` editorial rows: `JTable` / `JDataTable` (`Table` / `DataTable`).
  - `500–50,000+` custom rows or feeds: `JVirtualList` / `VirtualList` (`itemHeight` number or function, or `variableHeight` via `ResizeObserver`).
  - Dense multi-column workbenches: `JDataGrid` / `DataGrid` (virtualized `role="grid"`, `pinned: 'left' | 'right'`, resizable columns, `Shift+Click` / `Shift+Enter` multi-sort, `Shift`-range multi-select, 2D arrow + header keyboard navigation, `@row-contextmenu`).
  - Remote / large hierarchies: `JTreeView` / `TreeView` with `lazy: true` + `:load-children="fn"` (`loadChildren`).
  - Inline KPI & table trends: `JSparkline` / `Sparkline` (`variant="line" | "area" | "bar"`, `smooth` monotone cubic, `showEndDot`, `showMinMax`).
- **Forms, Menus & Badges:**
  - Use `clearable` on `JInput` / `Input`, `JSplitButton` / `SplitButton` for primary action + secondary menu, `JDropdownSub` / `DropdownSub` for cascading submenus inside both `DropdownMenu` and `ContextMenu`, `allowCustomValue` + `creatable` + `loading` + `:filter="false"` + `debounce` on `JCombobox` / `Combobox`, and `removable` (`@remove` / `onRemove`) on `JBadge` / `Badge`.
- **Dialogs, Drawers & Flush Containers:** `JDialog`/`Dialog` and `JDrawer`/`Drawer` teleport to `<body>` by default (`teleport` defaults to `true`; pass `:teleport="false"` / `teleport={false}` only for inline container previews). Pass `flush` on `Card`, `Dialog`, or `Drawer` to remove body padding for edge-to-edge grids, lists, editors, or terminals.
- **Context Menus:** `JContextMenu` / `ContextMenu` only closes when an ancestor of its trigger scrolls (streaming sibling logs/terminals never dismiss open menus) and exposes `openAt(x, y)`, `openFor(el)`, and `openFromEvent(e)` on its template `ref`.
- **Icons:** Use `JIcon` / `Icon` (`65` built-in 16×16 stroke icons) and connect app icon libraries once via `provideIcons(resolver)` (Vue), `<IconProvider icons={...}>` (React), or `registerIcons(map)`.
- **Charts, Editors & Terminals:** Use `useThemeTokens()` (Vue/React) or `getThemeTokens()` / `onThemeChange()` (`jenni-core`) to feed live `#rrggbb` colors for `--j-chart-1..8`, `--j-syntax-*` (CodeMirror/Monaco), and 16-color ANSI `xterm.js` `ITheme` (`tokens.terminal`).
- **Keyboard Shortcuts:** Use `useShortcut` / `useShortcuts` (or `registerShortcut`) — pass `{ scope: rootRef }` for view-local shortcuts so hidden tabs, `inert` panes, background views behind modal `<dialog>`, and focused `.xterm` terminals are automatically ignored.

---

## 5. Idiomatic Code Recipes

Read [references/RECIPES.md](./references/RECIPES.md) for copy-ready Vue 3 and React 19 implementation patterns covering shells, dense data grids with context menus, document tabs, verified toasts, custom icon registries, live xterm/chart theming, and scoped shortcuts.

---

# Idiomatic Recipes (`jenni-vue` & `jenni-react`)

## 1. Workbench Shell + Toolbar + Document Tabs + Status Bar

### Vue 3 (`jenni-vue`)
```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  JAppShell, JSidebar, JSidebarGroup, JSidebarItem,
  JToolbar, JToolbarGroup, JToolbarSeparator, JToolbarSpacer,
  JDocTabs, JStatusBar, JStatusBarItem, JButton, JIcon,
  type DocTabItem,
} from 'jenni-vue';

const activeTab = ref('grid.ts');
const tabs = ref<DocTabItem[]>([
  { id: 'workspace.json', label: 'workspace.json', pinned: true, closable: false },
  { id: 'grid.ts', label: 'grid.ts', dirty: true },
  { id: 'queries.sql', label: 'queries.sql' },
]);

function closeTab(id: string) {
  tabs.value = tabs.value.filter((t) => t.id !== id);
}
</script>

<template>
  <JAppShell layout="ide" variant="inset">
    <template #sidebar>
      <JSidebar>
        <JSidebarGroup label="Explorer">
          <JSidebarItem active><JIcon name="folder" /> src</JSidebarItem>
          <JSidebarItem><JIcon name="terminal" /> Console</JSidebarItem>
        </JSidebarGroup>
      </JSidebar>
    </template>

    <template #topbar>
      <JToolbar size="sm" border="bottom">
        <JToolbarGroup>
          <JButton size="sm" variant="ghost"><JIcon name="play" /> Run</JButton>
          <JButton size="sm" variant="ghost"><JIcon name="refresh" /> Sync</JButton>
        </JToolbarGroup>
        <JToolbarSeparator />
        <JToolbarSpacer />
        <JButton size="sm" variant="soft"><JIcon name="search" /> Command</JButton>
      </JToolbar>
    </template>

    <JDocTabs
      v-model="activeTab"
      v-model:tabs="tabs"
      addable
      reorderable
      @close="closeTab"
    />

    <template #statusbar>
      <JStatusBar variant="subtle">
        <template #start>
          <JStatusBarItem interactive><JIcon name="git-branch" size="xs" /> main</JStatusBarItem>
          <JStatusBarItem tone="success">0 errors</JStatusBarItem>
        </template>
        <template #end>
          <JStatusBarItem mono>UTF-8</JStatusBarItem>
          <JStatusBarItem mono>Ln 42, Col 8</JStatusBarItem>
        </template>
      </JStatusBar>
    </template>
  </JAppShell>
</template>
```

### React 19 (`jenni-react`)
```tsx
import { useState } from 'react';
import {
  AppShell, Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarSpacer,
  DocTabs, StatusBar, StatusBarItem, Button, Icon, type DocTabItem,
} from 'jenni-react';

export function Workbench() {
  const [active, setActive] = useState('grid.ts');
  const [tabs, setTabs] = useState<DocTabItem[]>([
    { id: 'workspace.json', label: 'workspace.json', pinned: true, closable: false },
    { id: 'grid.ts', label: 'grid.ts', dirty: true },
  ]);

  return (
    <AppShell
      layout="ide"
      variant="inset"
      topbar={
        <Toolbar size="sm" border="bottom">
          <ToolbarGroup>
            <Button size="sm" variant="ghost"><Icon name="play" /> Run</Button>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarSpacer />
        </Toolbar>
      }
      statusbar={
        <StatusBar
          start={<StatusBarItem interactive><Icon name="git-branch" size="xs" /> main</StatusBarItem>}
          end={<StatusBarItem mono>Ln 42, Col 8</StatusBarItem>}
        />
      }
    >
      <DocTabs
        value={active}
        onValueChange={setActive}
        tabs={tabs}
        onTabsChange={setTabs}
        onClose={(id) => setTabs((prev) => prev.filter((t) => t.id !== id))}
        addable
        reorderable
      />
    </AppShell>
  );
}
```

---

## 2. Dense Virtualized `DataGrid` + Imperative `ContextMenu`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  JDataGrid, JContextMenu, JDropdownItem, JDropdownSeparator, JAvatar, JBadge,
  type DataGridColumn, type DataGridSort, type JContextMenuExpose,
} from 'jenni-vue';

interface PullRequestRow {
  id: string;
  title: string;
  author: string;
  additions: number;
  updated: string;
}

const columns: DataGridColumn<PullRequestRow>[] = [
  { key: 'id', label: 'PR', width: 96, pinned: 'left', mono: true, sortable: true, resizable: true },
  { key: 'title', label: 'Title', width: 320, minWidth: 180, sortable: true, searchable: true, resizable: true },
  { key: 'author', label: 'Author', width: 180, sortable: true, searchable: true, resizable: true },
  { key: 'additions', label: 'Lines +', width: 96, align: 'end', mono: true, sortable: true },
  { key: 'updated', label: 'Updated', width: 108, align: 'end', pinned: 'right', resizable: true },
];

const rows = ref<PullRequestRow[]>([/* ... */]);
const selected = ref<(string | number)[]>([]);
const sorts = ref<DataGridSort[]>([{ key: 'id', direction: 'desc' }]);
const menuRef = ref<JContextMenuExpose | null>(null);
const contextRow = ref<PullRequestRow | null>(null);

function onRowContextMenu(payload: { row: PullRequestRow; index: number; event: MouseEvent }) {
  contextRow.value = payload.row;
  menuRef.value?.openFromEvent(payload.event);
}
</script>

<template>
  <JDataGrid
    v-model:selected-keys="selected"
    v-model:sorts="sorts"
    :rows="rows"
    :columns="columns"
    row-key="id"
    selectable="multiple"
    searchable
    dense
    height="480px"
    @row-contextmenu="onRowContextMenu"
  >
    <template #cell-author="{ value }">
      <JAvatar :name="String(value)" size="xs" auto-color />
      <span>{{ value }}</span>
    </template>
  </JDataGrid>

  <JContextMenu ref="menuRef">
    <JDropdownItem @select="/* open */">Open {{ contextRow?.id }}</JDropdownItem>
    <JDropdownSeparator />
    <JDropdownItem tone="danger">Close pull request</JDropdownItem>
  </JContextMenu>
</template>
```

---

## 3. Verified Action Toasts (`toast.promise` & `toast.fromResult`)

Never show optimistic success before verifying the server result:

```ts
import { toast } from 'jenni-vue'; // or 'jenni-react' / 'jenni-core'

await toast.promise(
  () => fetch('/api/deploy', { method: 'POST' }).then((r) => r.json()),
  {
    loading: 'Deploying release…',
    // Automatically rejects { ok: false, error } envelopes AND custom checks:
    verify: (res) => (res.healthyInstances > 0 ? true : 'Zero healthy instances reported'),
    success: (res) => ({
      title: 'Release verified',
      description: `${res.healthyInstances} instances serving traffic.`,
    }),
    error: (err) => ({
      title: 'Deployment failed',
      description: err instanceof Error ? err.message : String(err),
    }),
    throwOnError: false,
  },
);
```

---

## 4. Pluggable App Icon Registry (`provideIcons` / `IconProvider`)

```ts
// Vue 3 (e.g. App.vue setup — connects Lucide, Tabler, or custom SVGs)
import { provideIcons } from 'jenni-vue';
import * as lucide from 'lucide-vue-next';

provideIcons((name) => {
  const pascal = name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
  return (lucide as Record<string, unknown>)[pascal] as any;
});
```

```tsx
// React 19
import { IconProvider, Icon } from 'jenni-react';
import { Activity, GitBranch } from 'lucide-react';

export function AppRoot({ children }: { children: React.ReactNode }) {
  return (
    <IconProvider icons={{ activity: Activity, 'git-branch': GitBranch }}>
      {children}
    </IconProvider>
  );
}
```

---

## 5. Live Theme Colors for Charts, CodeMirror & `xterm.js`

```ts
// Vue: const tokens = useThemeTokens(); (Ref<ThemeTokens>)
// React: const tokens = useThemeTokens(); (ThemeTokens)
import { onThemeChange } from 'jenni-core';

const stop = onThemeChange((tokens) => {
  // 1. xterm.js: tokens.terminal satisfies xterm ITheme (background, foreground, cursor, 16 ANSI hexes)
  terminal.options.theme = tokens.terminal;

  // 2. Charts (ECharts / Chart.js / D3): 8 perceptual OKLCH series hexes
  chart.setOption({ color: tokens.charts.series });

  // 3. CodeMirror / Monaco: tokens.syntax.{bg, fg, keyword, string, function, comment, type, ...}
});
```

---

## 6. Tab- & Visibility-Aware Keyboard Shortcuts

Shortcuts scoped to a pane automatically ignore keystrokes when their tab is hidden (`[hidden]`, `display: none`, `inert`), behind an open modal `<dialog>`, or when focus is inside `.xterm` or text inputs:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useShortcut, JKbd } from 'jenni-vue';

const paneRef = ref<HTMLElement | null>(null);

useShortcut('mod+enter', () => runQuery(), {
  scope: paneRef,
  allowModInInputs: true, // allow Cmd/Ctrl+Enter inside SQL textarea
});
useShortcut('g p', () => navigateToPullRequests(), { scope: paneRef });
</script>
```

---

## 7. Deterministic Entity Colors, Calendar Dots & Segmented Progress

```vue
<!-- Same author name always maps to the same perceptual hue in Light & Dark -->
<JAvatar name="Ada Lovelace" auto-color />
<JBadge auto-color color-seed="Ada Lovelace">Author</JBadge>

<!-- Calendar day activity dots (Record, Set, Array, or (iso) => markers) -->
<JCalendar v-model="date" :markers="{ '2026-11-20': ['accent', 'success'], '2026-11-21': 'warning' }" />

<!-- Multi-segment & discrete stepped progress bars -->
<JProgress :max="100" :segments="[
  { value: 72, tone: 'success', label: 'Passed' },
  { value: 12, tone: 'warning', label: 'Flaky' },
  { value: 6, tone: 'danger', label: 'Failed' },
]" />
<JProgress :value="4" :steps="6" tone="accent" />
```

---

## Complete Component Index (AST-Generated)

| Vue / React | Group | Granular CSS | Props | Slots |
|---|---|---|---|---|
| `JAiCanvas` / `AiCanvas` | layout | `jenni-core/css/screens.css` | artifactOpen, as, artifactTitle, embedded, height | header, default, composer, artifact-header, artifact-actions, artifact |
| `JAppShell` / `AppShell` | layout | `jenni-core/css/shell.css` | asideOpen, dockOpen, activePane, sidebarOpen, layout, variant, sidebarSide, embedded, height, dockHeight, asideWidth, railLabel, subnavLabel, asideLabel, dockLabel, bannerLabel, masterLabel | banner, topbar, subbar, default, aside, dock, bottombar, statusbar, rail, sidebar, subnav, master |
| `JAuthSplit` / `AuthSplit` | layout | `jenni-core/css/screens.css` | as, reverse, stackShowcase, embedded, height | header, default, footer, showcase |
| `JBento` / `Bento` | layout | `jenni-core/css/screens.css` | as, gap, rowMinHeight | default |
| `JBentoCell` / `BentoCell` | layout | `jenni-core/css/screens.css` | as, span, rowSpan, surface | default |
| `JBoard` / `Board` | layout | `jenni-core/css/screens.css` | as, gap, columnWidth | default |
| `JBoardColumn` / `BoardColumn` | layout | `jenni-core/css/screens.css` | as, title, count, tone, dot | header, actions, default, footer |
| `JBottomBar` / `BottomBar` | layout | `jenni-core/css/bars.css` | as, variant, sticky, translucent, tone | default |
| `JBottomBarItem` / `BottomBarItem` | layout | `jenni-core/css/bars.css` | as, label, badge, active, disabled | icon, default |
| `JCanvasStage` / `CanvasStage` | layout | `jenni-core/css/screens.css` | as, grid, toolsPlacement, inspectorOpen, embedded, height | default, top, tools, inspector, hud |
| `JCol` / `Col` | layout | `jenni-core/css/grid.css` | as, span, sm, md, lg, start, rowSpan, order, align, subgrid | default |
| `JContainer` / `Container` | layout | `jenni-core/css/primitives.css` | as, size, padded | default |
| `JDocsLayout` / `DocsLayout` | layout | `jenni-core/css/screens.css` | as, tocTitle, embedded, height | nav, default, toc |
| `JGrid` / `Grid` | layout | `jenni-core/css/grid.css` | as, cols, minCellWidth, gap, colGap, rowGap, flow, align, justify, container, guides | default |
| `JInline` / `Inline` | layout | `jenni-core/css/primitives.css` | as, gap, align, justify, nowrap | default |
| `JList` / `List` | layout | `jenni-core/css/list.css` | as, variant, lines, insetDivider, tone | default |
| `JListItem` / `ListItem` | layout | `jenni-core/css/list.css` | as, title, description, lines, interactive, selected, current, disabled, tone | leading, default, title, description, trailing |
| `JPage` / `Page` | layout | `jenni-core/css/page.css` | as, size | default |
| `JPageHeader` / `PageHeader` | layout | `jenni-core/css/page.css` | title, description, eyebrow, bordered | eyebrow, title, description, default, actions |
| `JResizableGroup` / `ResizableGroup` | layout | `jenni-core/css/resizable.css` | as, orientation, autoSaveId, step, bordered, height, width | default |
| `JResizableHandle` / `ResizableHandle` | layout | `jenni-core/css/resizable.css` | withGrip, disabled, ariaLabel | — |
| `JResizablePanel` / `ResizablePanel` | layout | `jenni-core/css/resizable.css` | as, id, defaultSize, minSize, maxSize, collapsible, collapsedSize | default |
| `JScrollArea` / `ScrollArea` | layout | `jenni-core/css/scroll-area.css` | as, orientation, scrollbar, fade, fadeSize, maxHeight, maxWidth, height, width, bordered | default |
| `JSection` / `Section` | layout | `jenni-core/css/page.css` | as, title, description, layout, bordered | header, title, description, actions, default |
| `JSidebar` / `Sidebar` | layout | `jenni-core/css/bars.css` | collapsed, as, tone, ariaLabel | header, default, footer |
| `JSidebarGroup` / `SidebarGroup` | layout | `jenni-core/css/bars.css` | label | label, default |
| `JSidebarItem` / `SidebarItem` | layout | `jenni-core/css/bars.css` | as, label, badge, active, disabled | icon, default, badge |
| `JStack` / `Stack` | layout | `jenni-core/css/primitives.css` | as, gap, align, justify | default |
| `JStatusBar` / `StatusBar` | layout | `jenni-core/css/statusbar.css` | as, variant, border, ariaLabel, role | start, default, center, end |
| `JStatusBarItem` / `StatusBarItem` | layout | `jenni-core/css/statusbar.css` | as, icon, dot, tone, interactive, href, title, disabled, separator | icon, default |
| `JStatusBarSeparator` / `StatusBarSeparator` | layout | `jenni-core/css/statusbar.css` | — | — |
| `JToolbar` / `Toolbar` | layout | `jenni-core/css/toolbar.css` | as, size, orientation, border, surface, sticky, translucent, wrap, loop, ariaLabel | start, default, center, end |
| `JToolbarGroup` / `ToolbarGroup` | layout | `jenni-core/css/toolbar.css` | as, ariaLabel | default |
| `JToolbarSeparator` / `ToolbarSeparator` | layout | `jenni-core/css/toolbar.css` | orientation | — |
| `JToolbarSpacer` / `ToolbarSpacer` | layout | `jenni-core/css/toolbar.css` | — | — |
| `JTopBar` / `TopBar` | layout | `jenni-core/css/bars.css` | as, sticky, translucent | start, default, center, end |
| `JButton` / `Button` | forms | `jenni-core/css/button.css` | variant, size, tone, loading, disabled, iconOnly, fullWidth, type, as | default |
| `JButtonGroup` / `ButtonGroup` | forms | `jenni-core/css/button.css` | variant, size, tone, fullWidth | default |
| `JCalendar` / `Calendar` | forms | `jenni-core/css/date-picker.css` | modelValue, mode, min, max, weekStartsOn, showFooter, tone, disabled, locale, markers | day |
| `JCheckbox` / `Checkbox` | forms | `jenni-core/css/checkbox.css` | indeterminate, modelValue, size, tone, invalid, label, description | default, description |
| `JColorPicker` / `ColorPicker` | forms | `jenni-core/css/color-picker.css` | modelValue, mode, inline, format, alpha, swatches, size, tone, disabled, invalid, name | — |
| `JDatePicker` / `DatePicker` | forms | `jenni-core/css/date-picker.css` | modelValue, mode, min, max, weekStartsOn, placeholder, clearable, showFooter, size, tone, disabled, invalid, name, locale, markers | day |
| `JField` / `Field` | forms | `jenni-core/css/field.css` | label, hint, error, required, disabled, invalid, id | label, default, hint, error |
| `JFileUpload` / `FileUpload` | forms | `jenni-core/css/file-upload.css` | modelValue, accept, multiple, maxSize, maxFiles, variant, tone, label, hint, disabled, invalid | — |
| `JInput` / `Input` | forms | `jenni-core/css/input.css` | modelValue, size, tone, invalid, clearable, clearLabel | prefix, suffix |
| `JLabel` / `Label` | forms | `jenni-core/css/field.css` | required | default |
| `JNumberInput` / `NumberInput` | forms | `jenni-core/css/number-input.css` | modelValue, min, max, step, controls, prefix, suffix, placeholder, size, tone, disabled, invalid, readonly | prefix, suffix |
| `JPinInput` / `PinInput` | forms | `jenni-core/css/pin-input.css` | modelValue, length, type, mask, separator, placeholder, otp, size, tone, disabled, invalid | — |
| `JRadio` / `Radio` | forms | `jenni-core/css/radio.css` | modelValue, value, size, tone, invalid, disabled, label, description | default, description |
| `JRadioGroup` / `RadioGroup` | forms | `jenni-core/css/radio.css` | modelValue, name, orientation, size, tone, disabled, invalid | default |
| `JRichTextEditor` / `RichTextEditor` | forms | `jenni-core/css/rich-text.css` | modelValue, placeholder, minRows, minHeight, toolbar, showFooter, tone, readonly, disabled, invalid, name | — |
| `JSegmentedControl` / `SegmentedControl` | forms | `jenni-core/css/segmented.css` | modelValue, defaultValue, options, size, tone, fullWidth, disabled | default |
| `JSegmentedItem` / `SegmentedItem` | forms | `jenni-core/css/segmented.css` | value, disabled | default |
| `JSelect` / `Select` | forms | `jenni-core/css/select.css` | modelValue, options, placeholder, size, tone, invalid | default |
| `JSlider` / `Slider` | forms | `jenni-core/css/slider.css` | modelValue, defaultValue, min, max, step, size, tone, invalid | — |
| `JSplitButton` / `SplitButton` | forms | `jenni-core/css/button.css` | open, label, variant, size, tone, disabled, loading, menuDisabled, menuLabel, side, align, type | default, menu |
| `JSwitch` / `Switch` | forms | `jenni-core/css/switch.css` | modelValue, size, tone, invalid, label, description, placement | default, description |
| `JTagInput` / `TagInput` | forms | `jenni-core/css/tag-input.css` | modelValue, maxTags, allowDuplicates, placeholder, size, tone, disabled, invalid | — |
| `JTextarea` / `Textarea` | forms | `jenni-core/css/textarea.css` | modelValue, size, tone, invalid, autoGrow | — |
| `JTimePicker` / `TimePicker` | forms | `jenni-core/css/time-picker.css` | modelValue, format, seconds, minuteStep, clearable, size, tone, disabled, invalid, name | — |
| `JToggle` / `Toggle` | forms | `jenni-core/css/toggle.css` | modelValue, value, variant, size, tone, iconOnly, fullWidth, disabled | default |
| `JToggleGroup` / `ToggleGroup` | forms | `jenni-core/css/toggle.css` | modelValue, type, variant, size, tone, attached, fullWidth, disallowEmpty, disabled | default |
| `JAccordion` / `Accordion` | display | `jenni-core/css/accordion.css` | modelValue, variant, size, multiple, collapsible, defaultValue, name | default |
| `JAccordionItem` / `AccordionItem` | display | `jenni-core/css/accordion.css` | open, value, title, subtitle, defaultOpen, disabled | icon, title, subtitle, indicator, default |
| `JAlert` / `Alert` | display | `jenni-core/css/alert.css` | variant, tone, title, description, icon | icon, title, default, actions |
| `JAvatar` / `Avatar` | display | `jenni-core/css/avatar.css` | src, alt, name, initials, size, shape, tone, status, colorSeed, autoColor | default |
| `JAvatarGroup` / `AvatarGroup` | display | `jenni-core/css/avatar.css` | size, max, total | default |
| `JBadge` / `Badge` | display | `jenni-core/css/badge.css` | variant, size, tone, dot, removable, closable, removeLabel, colorSeed, autoColor | icon, default |
| `JBreadcrumb` / `Breadcrumb` | display | `jenni-core/css/breadcrumb.css` | separator, variant, size, label, maxItems, itemsBeforeCollapse, itemsAfterCollapse | default |
| `JBreadcrumbItem` / `BreadcrumbItem` | display | `jenni-core/css/breadcrumb.css` | href, current, ellipsis, label | default, icon |
| `JCard` / `Card` | display | `jenni-core/css/card.css` | as, variant, size, title, description, interactive, footerDivider, flush, bodyFlush | media, header, action, default, footer |
| `JCarousel` / `Carousel` | display | `jenni-core/css/carousel.css` | modelValue, defaultValue, slidesPerView, gap, loop, autoplay, arrows, dots, showCounter, orientation, tone, height, label | default, footer |
| `JCarouselSlide` / `CarouselSlide` | display | `jenni-core/css/carousel.css` | label, index | default |
| `JCollapsible` / `Collapsible` | display | `jenni-core/css/accordion.css` | modelValue, variant, size, title, defaultOpen, disabled | icon, trigger, default |
| `JDataGrid` / `DataGrid` | display | `jenni-core/css/data-grid.css` | search, sorts, selectedKeys, rows, columns, rowKey, height, rowHeight, size, dense, striped, bordered, selectable, defaultSelectedKeys, defaultSorts, searchable, defaultSearch, searchPlaceholder, virtualized, overscan, loading, emptyTitle, emptyDescription, showFooter, ariaLabel | toolbar, toolbar-actions, header-${key}, header, empty, cell-${key}, cell, footer |
| `JDataTable` / `DataTable` | display | `jenni-core/css/table.css` | page, search, sortDir, sortBy, selected, columns, rows, rowKey, selectable, searchable, searchPlaceholder, pageSize, variant, size, hover, stickyHeader, pinFirst, pinLast, maxHeight, emptyTitle, emptyDescription, caption | toolbar, actions, header-${key}, empty, cell-${key}, footer |
| `JEmptyState` / `EmptyState` | display | `jenni-core/css/empty-state.css` | variant, size, tone, title, description | icon, title, description, default, actions |
| `JIcon` / `Icon` | display | `jenni-core/css/icon.css` | name, size, tone, strokeWidth, spin, label | default |
| `JKbd` / `Kbd` | display | `jenni-core/css/kbd.css` | size | default |
| `JPagination` / `Pagination` | display | `jenni-core/css/pagination.css` | modelValue, total, pageSize, totalPages, defaultPage, siblingCount, boundaryCount, variant, size, tone, showLabels, disabled, label | — |
| `JProgress` / `Progress` | display | `jenni-core/css/progress.css` | value, max, size, tone, label, segments, steps | — |
| `JSeparator` / `Separator` | display | `jenni-core/css/separator.css` | orientation, label, align, decorative | default |
| `JSkeleton` / `Skeleton` | display | `jenni-core/css/skeleton.css` | shape, width, height, lines | default |
| `JSparkline` / `Sparkline` | display | `jenni-core/css/sparkline.css` | data, variant, width, height, tone, color, smooth, strokeWidth, min, max, showEndDot, showMinMax, fillOpacity, label | — |
| `JSpinner` / `Spinner` | display | `jenni-core/css/spinner.css` | size, label | — |
| `JStep` / `Step` | display | `jenni-core/css/stepper.css` | index, title, description, status, disabled | icon, default, description |
| `JStepper` / `Stepper` | display | `jenni-core/css/stepper.css` | modelValue, steps, defaultValue, orientation, size, tone, clickable, linear, label | default |
| `JTable` / `Table` | display | `jenni-core/css/table.css` | variant, size, hover, stickyHeader, pinFirst, pinLast, caption, maxHeight | caption, default |
| `JTreeItem` / `TreeItem` | display | `jenni-core/css/tree-view.css` | value, label, icon, meta, disabled, defaultExpanded, lazy, hasChildren, loading, node | icon, label, meta, children, default |
| `JTreeView` / `TreeView` | display | `jenni-core/css/tree-view.css` | expanded, modelValue, nodes, multiple, guides, size, tone, label, defaultValue, defaultExpanded, expandOnClick, loadChildren | default |
| `JVirtualList` / `VirtualList` | display | `jenni-core/css/virtual-list.css` | items, itemHeight, estimateHeight, height, overscan, keyField, divided, role, ariaLabel | empty, default |
| `JCombobox` / `Combobox` | overlay | `jenni-core/css/combobox.css` | modelValue, options, multiple, placeholder, emptyText, size, clearable, disabled, invalid, name, filter, allowCustomValue, freeSolo, commitOnBlur, creatable, loading, loadingText, debounce, search | — |
| `JCommandPalette` / `CommandPalette` | overlay | `jenni-core/css/command-palette.css` | query, open, items, groups, placeholder, emptyText, shortcut, inline, closeOnSelect, dismissible, showFooter, showEsc, ariaLabel, breadcrumbs, filter | trigger, header, default, item, item-icon, empty, footer |
| `JContextMenu` / `ContextMenu` | overlay | `jenni-core/css/context-menu.css` | open, loop, disabled, target | trigger, default |
| `JDialog` / `Dialog` | overlay | `jenni-core/css/dialog.css` | open, title, description, size, closable, dismissible, flush, bodyFlush, teleport | trigger, header, default, footer |
| `JDocTabs` / `DocTabs` | overlay | `jenni-core/css/doc-tabs.css` | modelValue, tabs, defaultValue, variant, size, closable, closablePinned, addable, reorderable, middleClickClose, showOverflowMenu, hideTabTail, ariaLabel, addLabel, overflowLabel | tab, icon, label, empty, actions |
| `JDrawer` / `Drawer` | overlay | `jenni-core/css/drawer.css` | open, title, description, side, size, inset, closable, dismissible, flush, bodyFlush, teleport | trigger, header, default, footer |
| `JDropdownItem` / `DropdownItem` | overlay | `jenni-core/css/menu.css` | checked, as, href, role, shortcut, tone, inset, disabled, keepOpen, closeOnSelect, textValue | icon, default, shortcut |
| `JDropdownLabel` / `DropdownLabel` | overlay | `jenni-core/css/menu.css` | inset | default |
| `JDropdownMenu` / `DropdownMenu` | overlay | `jenni-core/css/menu.css` | open, side, align, arrow, loop, anchor | trigger, default |
| `JDropdownSeparator` / `DropdownSeparator` | overlay | `jenni-core/css/menu.css` | — | — |
| `JDropdownSub` / `DropdownSub` | overlay | `jenni-core/css/menu.css` | open, label, inset, disabled, textValue | icon, trigger, default |
| `JHoverCard` / `HoverCard` | overlay | `jenni-core/css/hover-card.css` | open, side, align, size, arrow, openDelay, closeDelay, disabled, anchor | trigger, default |
| `JPopover` / `Popover` | overlay | `jenni-core/css/popover.css` | open, side, align, size, arrow, anchor | trigger, default |
| `JTab` / `Tab` | overlay | `jenni-core/css/tabs.css` | value, disabled | default |
| `JTabList` / `TabList` | overlay | `jenni-core/css/tabs.css` | — | default |
| `JTabPanel` / `TabPanel` | overlay | `jenni-core/css/tabs.css` | value | default |
| `JTabs` / `Tabs` | overlay | `jenni-core/css/tabs.css` | modelValue, defaultValue, variant, size, orientation, activation, full | default |
| `JToaster` / `Toaster` | overlay | `jenni-core/css/toast.css` | position, max, expanded | — |
| `JTooltip` / `Tooltip` | overlay | `jenni-core/css/tooltip.css` | content, side, align, arrow, delay, kbd, disabled | default, content |
