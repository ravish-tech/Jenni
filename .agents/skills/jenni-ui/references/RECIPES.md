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
