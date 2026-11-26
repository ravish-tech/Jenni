# Idiomatic Recipes (`jenni-vue` & `jenni-react`)

## 1. Chrome-Style Tab Strip (`JTabStrip`) + Resizable `JSidebarLayout` + `JStatusBar`

### Vue 3 (`jenni-vue`)
```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  JSidebarLayout, JSidebarToggle, JTabStrip, JToolbar, JToolbarSpacer,
  JStatusBar, JStatusBarItem, JStatusBarSeparator, JButton, JIcon,
  type TabStripItem,
} from 'jenni-vue';

const activeTab = ref('query-1');
const tabs = ref<TabStripItem[]>([
  { id: 'schema', title: 'schema.sql', icon: 'database', pinned: true, closable: false },
  { id: 'query-1', title: 'active_users.sql', icon: 'code', dirty: true, description: 'warehouse.public · 42ms' },
  { id: 'preview-1', title: 'audit_log.sql', icon: 'file-text', preview: true },
]);

function onClose(id: string) {
  tabs.value = tabs.value.filter((t) => t.id !== id);
}

function onReorder({ from, to }: { from: number; to: number }) {
  const next = [...tabs.value];
  const [moved] = next.splice(from, 1);
  if (moved) next.splice(to, 0, moved);
  tabs.value = next;
}
</script>

<template>
  <JSidebarLayout storage-key="sql-workbench" :default-width="260" toggle-label="Explorer">
    <template #sidebar>
      <!-- Full-height Explorer tree -->
    </template>
    <template #rail>
      <!-- Optional compact icon rail when state === 'rail' -->
    </template>

    <div style="display:flex; flex-direction:column; height:100%; min-height:0">
      <JToolbar size="sm" border="bottom">
        <!-- Context-wired toggle: automatically shows 'Hide Explorer' / 'Show Explorer' -->
        <JSidebarToggle />
        <JButton size="sm" variant="ghost"><JIcon name="play" /> Run</JButton>
        <JToolbarSpacer />
      </JToolbar>

      <JTabStrip
        v-model:active="activeTab"
        :tabs="tabs"
        draggable
        detachable
        search
        style="--j-tab-strip-active-bg: var(--j-code-bg)"
        @close="onClose"
        @reorder="onReorder"
        @new="/* add tab after active */"
      />

      <main style="flex:1; min-height:0; overflow:auto">
        <!-- Editor surface -->
      </main>

      <JStatusBar size="md" text-size="xs" mono>
        <template #start>
          <JStatusBarItem interactive><JIcon name="git-branch" /> main</JStatusBarItem>
          <JStatusBarSeparator />
          <JStatusBarItem tone="success">Connected</JStatusBarItem>
        </template>
        <template #end>
          <JStatusBarItem>Ln 42, Col 8</JStatusBarItem>
        </template>
      </JStatusBar>
    </div>
  </JSidebarLayout>
</template>
```

### React 19 (`jenni-react`)
```tsx
import { useState } from 'react';
import {
  SidebarLayout, SidebarToggle, TabStrip, Toolbar, ToolbarSpacer,
  StatusBar, StatusBarItem, StatusBarSeparator, Button, Icon, type TabStripItem,
} from 'jenni-react';

export function SqlWorkbench() {
  const [active, setActive] = useState('query-1');
  const [tabs, setTabs] = useState<TabStripItem[]>([
    { id: 'schema', title: 'schema.sql', icon: 'database', pinned: true, closable: false },
    { id: 'query-1', title: 'active_users.sql', icon: 'code', dirty: true },
  ]);

  return (
    <SidebarLayout
      storageKey="sql-workbench"
      defaultWidth={260}
      toggleLabel="Explorer"
      sidebar={<div>Explorer</div>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <Toolbar size="sm" border="bottom">
          <SidebarToggle />
          <Button size="sm" variant="ghost"><Icon name="play" /> Run</Button>
          <ToolbarSpacer />
        </Toolbar>
        <TabStrip
          active={active}
          onActiveChange={setActive}
          tabs={tabs}
          draggable
          search
          onClose={(id) => setTabs((prev) => prev.filter((t) => t.id !== id))}
          onReorder={({ from, to }) =>
            setTabs((prev) => {
              const next = [...prev];
              const [moved] = next.splice(from, 1);
              if (moved) next.splice(to, 0, moved);
              return next;
            })
          }
        />
        <StatusBar
          size="md"
          mono
          start={<StatusBarItem interactive><Icon name="git-branch" /> main</StatusBarItem>}
          end={<StatusBarItem>UTF-8</StatusBarItem>}
        />
      </div>
    </SidebarLayout>
  );
}
```

---

## 2. Dialog Default Action on `Enter`, Native Body Scroll & Clearable `JSelect`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { JDialog, JField, JInput, JSelect, JButton } from 'jenni-vue';

const open = ref(false);
const title = ref('');
const assignee = ref('ada');

function saveIssue() {
  open.value = false;
}
</script>

<template>
  <!-- Let JDialog's own body scroll; never wrap short forms in <JScrollArea height="100%"> -->
  <JDialog v-model:open="open" title="Confirm paste" description="Primary action focuses on open and fires on Enter.">
    <JField label="Target environment">
      <JSelect v-model="assignee" clearable clear-tooltip="Reset target">
        <option value="">Default</option>
        <option value="ada">Staging</option>
        <option value="grace">Production</option>
      </JSelect>
    </JField>
    <JField label="Filter tag (optional)">
      <JInput v-model="title" clearable placeholder="Filter…" />
    </JField>
    <template #footer>
      <JButton variant="ghost" @click="open = false">Cancel</JButton>
      <!-- `default` focuses on open and fires on Enter when focus is outside text inputs/textarea/select/other buttons -->
      <JButton variant="solid" default @click="saveIssue">Paste commands</JButton>
    </template>
  </JDialog>
</template>
```

---

## 3. Sticky `JPageHeader` + Collapsible `JTableSection` Groups

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { JPage, JPageHeader, JTable, JTableSection, JBadge, JButton } from 'jenni-vue';

const expanded = ref<string[]>(['p1', 'p2']);
</script>

<template>
  <JPage>
    <!-- IntersectionObserver sentinel reveals bottom border only when stuck -->
    <JPageHeader sticky title="Requirements" description="Grouped by priority tier.">
      <template #actions>
        <JButton size="sm" variant="ghost" @click="expanded = ['p1', 'p2']">Expand all</JButton>
        <JButton size="sm" variant="ghost" @click="expanded = []">Collapse all</JButton>
      </template>
    </JPageHeader>

    <JTable v-model:expanded-sections="expanded" hover>
      <thead>
        <tr>
          <th>ID</th>
          <th>Summary</th>
          <th>Status</th>
        </tr>
      </thead>
      <JTableSection id="p1" label="Priority 1" :count="2">
        <tr><td>R01</td><td>Context menu scroll isolation</td><td><JBadge tone="success">Shipped</JBadge></td></tr>
        <tr><td>R02</td><td>Imperative openAt(x, y)</td><td><JBadge tone="success">Shipped</JBadge></td></tr>
      </JTableSection>
      <JTableSection id="p2" label="Priority 2" :count="1">
        <tr><td>R09</td><td>Collapsible table sections</td><td><JBadge tone="success">Shipped</JBadge></td></tr>
      </JTableSection>
    </JTable>
  </JPage>
</template>
```

---

## 4. Custom Split Panes with `JSplitHandle` / `.j-resize-handle`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { JSplitHandle } from 'jenni-vue';

const consoleHeight = ref(220);
let startHeight = 220;
</script>

<template>
  <div style="display:flex; flex-direction:column; height:100%">
    <div style="flex:1; min-height:0">Editor</div>
    <JSplitHandle
      orientation="vertical"
      with-grip
      aria-label="Resize console"
      @drag-start="startHeight = consoleHeight"
      @drag="({ totalDelta }) => (consoleHeight = Math.min(480, Math.max(120, startHeight - totalDelta)))"
    />
    <div :style="{ height: `${consoleHeight}px` }">Terminal Output</div>
  </div>
</template>
```

---

## 5. Dense Virtualized `DataGrid` + Imperative `ContextMenu`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  JDataGrid, JContextMenu, JDropdownItem, JDropdownSeparator, JAvatar,
  type DataGridColumn, type DataGridSort, type JContextMenuExpose,
} from 'jenni-vue';

interface PullRequestRow {
  id: string;
  title: string;
  author: string;
  additions: number;
}

const columns: DataGridColumn<PullRequestRow>[] = [
  { key: 'id', label: 'PR', width: 96, pinned: 'left', mono: true, sortable: true, resizable: true },
  { key: 'title', label: 'Title', width: 320, minWidth: 180, sortable: true, searchable: true, resizable: true },
  { key: 'author', label: 'Author', width: 180, sortable: true, searchable: true, resizable: true },
  { key: 'additions', label: 'Lines +', width: 96, align: 'end', mono: true, sortable: true },
];

const rows = ref<PullRequestRow[]>([]);
const selected = ref<(string | number)[]>([]);
const sorts = ref<DataGridSort[]>([{ key: 'id', direction: 'desc' }]);
const menuRef = ref<JContextMenuExpose | null>(null);
const contextRow = ref<PullRequestRow | null>(null);

function onRowContextMenu(payload: { row: PullRequestRow; event: MouseEvent }) {
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
    <JDropdownItem>Open {{ contextRow?.id }}</JDropdownItem>
    <JDropdownSeparator />
    <JDropdownItem tone="danger">Close pull request</JDropdownItem>
  </JContextMenu>
</template>
```

---

## 6. Verified Action Toasts, Icon Registries, Live `xterm.js` Theming & Scoped Shortcuts

```ts
import { toast, provideIcons, useShortcut, useThemeTokens } from 'jenni-vue';
import { onThemeChange } from 'jenni-core';

// 1. Honest verified action toast (never shows false success on { ok: false })
await toast.promise(
  () => fetch('/api/deploy', { method: 'POST' }).then((r) => r.json()),
  {
    loading: 'Deploying release…',
    verify: (res) => (res.healthyInstances > 0 ? true : 'Zero healthy instances reported'),
    success: (res) => ({ title: 'Release verified', description: `${res.healthyInstances} instances ready.` }),
    error: (err) => ({ title: 'Deployment failed', description: err instanceof Error ? err.message : String(err) }),
    throwOnError: false,
  },
);

// 2. Pluggable app icon registry (unsized <JIcon> inside JButton/JToggle/JStatusBar scales automatically;
//    set `--j-icon-scale: 1.15` on :root if using a padded icon font like MDI)
provideIcons((name) => customIconMap[name]);

// 3. Live theme sync for xterm.js, ECharts & CodeMirror/Monaco
const stop = onThemeChange((tokens) => {
  terminal.options.theme = tokens.terminal;
  chart.setOption({ color: tokens.charts.series });
});

// 4. Visibility-aware shortcuts (ignored when paneRef's tab is hidden or behind a modal dialog)
useShortcut('mod+enter', () => runQuery(), { scope: paneRef, allowModInInputs: true });
```
