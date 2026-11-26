<script lang="ts">
export const meta = {
  name: 'Data Grid',
  group: 'Display',
  order: 14.5,
  wide: true,
  description: 'High-density virtualized data grid with pinned & resizable columns, Shift+Click multi-sort, Shift-range selection, 2D keyboard navigation, and context menu hooks.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JDataGrid,
  JContextMenu,
  JDropdownItem,
  JDropdownLabel,
  JDropdownSeparator,
  JBadge,
  JAvatar,
  JButton,
  JSwitch,
  JInline,
  JStack,
  type DataGridColumn,
  type DataGridSort,
  type JDataGridHandle,
} from 'jenni-vue';

interface PullRequestRow {
  id: string;
  title: string;
  author: string;
  repo: string;
  status: 'Merged' | 'Open' | 'Draft' | 'Changes';
  additions: number;
  latencyMs: number;
  updated: string;
}

const AUTHORS = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Margaret Hamilton',
  'Barbara Liskov',
  'Ken Thompson',
] as const;
const REPOS = ['core-tokens', 'shell-engine', 'runtime-agent', 'query-planner', 'doc-tabs'] as const;
const STATUSES = ['Open', 'Merged', 'Open', 'Draft', 'Changes'] as const;

const rows: PullRequestRow[] = Array.from({ length: 2500 }, (_, i) => ({
  id: `PR-${4200 - i}`,
  title: [
    'Isolate context-menu scroll listener from streaming terminal panes',
    'Add 50k-row virtualized DataGrid with pinned left/right columns',
    'Expose live OKLCH to hex/ANSI theme resolver for xterm & charts',
    'Teleport modal dialogs and drawers cleanly to document.body',
    'Support dirty dots, middle-click close, and overflow menu in DocTabs',
  ][i % 5]!,
  author: AUTHORS[i % AUTHORS.length]!,
  repo: REPOS[i % REPOS.length]!,
  status: STATUSES[i % STATUSES.length]!,
  additions: 24 + ((i * 37) % 940),
  latencyMs: Number((8.4 + ((i * 13) % 120) / 10).toFixed(1)),
  updated: `${(i % 58) + 1}m ago`,
}));

const columns: DataGridColumn<PullRequestRow>[] = [
  { key: 'id', label: 'PR', width: 96, pinned: 'left', mono: true, sortable: true, resizable: true },
  { key: 'title', label: 'Title', width: 320, minWidth: 180, sortable: true, searchable: true, resizable: true },
  { key: 'author', label: 'Author', width: 176, sortable: true, searchable: true, resizable: true },
  { key: 'repo', label: 'Package', width: 140, sortable: true, searchable: true, resizable: true },
  { key: 'status', label: 'State', width: 112, sortable: true },
  { key: 'additions', label: 'Lines +', width: 96, align: 'end', mono: true, sortable: true, format: (v) => `+${v}` },
  { key: 'latencyMs', label: 'CI p95', width: 96, align: 'end', mono: true, sortable: true, format: (v) => `${v} ms` },
  { key: 'updated', label: 'Updated', width: 104, align: 'end', pinned: 'right', resizable: true },
];

const dense = ref(true);
const striped = ref(false);
const bordered = ref(true);
const selectedKeys = ref<(string | number)[]>(['PR-4200', 'PR-4198']);
const sorts = ref<DataGridSort[]>([{ key: 'id', direction: 'desc' }]);
const gridRef = ref<JDataGridHandle | null>(null);

const ctxMenuRef = ref<InstanceType<typeof JContextMenu> | null>(null);
const contextRow = ref<PullRequestRow | null>(null);
const lastAction = ref('Right-click or press Shift+F10 on any row');

function onRowContext(row: PullRequestRow, _index: number, event: MouseEvent) {
  contextRow.value = row;
  (ctxMenuRef.value as any)?.openFromEvent?.(event);
}

const statusTone: Record<PullRequestRow['status'], 'success' | 'accent' | 'neutral' | 'warning'> = {
  Merged: 'success',
  Open: 'accent',
  Draft: 'neutral',
  Changes: 'warning',
};

const code = `<JDataGrid
  v-model:selected-keys="selectedKeys"
  v-model:sorts="sorts"
  :rows="rows"
  :columns="columns"
  selectable="multiple"
  searchable
  dense
  bordered
  show-footer
  @row-contextmenu="onRowContext"
/>`;
</script>

<template>
  <DemoSection
    title="2,500-Row Virtualized Engineering Grid"
    description="Drag column dividers to resize, Shift+Click headers for multi-column sort, Shift+Click rows for range selection, navigate cells with Arrow keys, or right-click any row."
  >
    <JStack gap="item" style="width: 100%">
      <JInline justify="between" wrap>
        <JInline gap="item" wrap>
          <JSwitch v-model="dense" size="sm">Dense rows</JSwitch>
          <JSwitch v-model="bordered" size="sm">Cell hairlines</JSwitch>
          <JSwitch v-model="striped" size="sm">Striped</JSwitch>
        </JInline>
        <JInline gap="related">
          <JButton size="sm" variant="outline" @click="gridRef?.scrollToRow(1250, 'center')">
            Jump Row #1,250
          </JButton>
          <JButton size="sm" variant="ghost" @click="gridRef?.clearSelection()">
            Clear ({{ selectedKeys.length }})
          </JButton>
        </JInline>
      </JInline>

      <JDataGrid
        ref="gridRef"
        v-model:selected-keys="selectedKeys"
        v-model:sorts="sorts"
        :rows="rows"
        :columns="columns"
        :height="380"
        :dense="dense"
        :striped="striped"
        :bordered="bordered"
        selectable="multiple"
        searchable
        search-placeholder="Filter 2,500 pull requests by title, author, or package…"
        show-footer
        aria-label="Pull requests data grid"
        @row-contextmenu="onRowContext"
      >
        <template #cell-author="{ row }">
          <JInline gap="inline" nowrap>
            <JAvatar :name="row.author" size="xs" auto-color />
            <span style="overflow: hidden; text-overflow: ellipsis">{{ row.author }}</span>
          </JInline>
        </template>

        <template #cell-repo="{ value }">
          <JBadge size="sm" :color-seed="String(value)">{{ value }}</JBadge>
        </template>

        <template #cell-status="{ row }">
          <JBadge size="sm" :tone="statusTone[row.status]" dot>{{ row.status }}</JBadge>
        </template>
      </JDataGrid>

      <JBadge variant="soft" tone="neutral">{{ lastAction }}</JBadge>

      <JContextMenu ref="ctxMenuRef">
        <JDropdownLabel>{{ contextRow ? `${contextRow.id} · ${contextRow.repo}` : 'Row Actions' }}</JDropdownLabel>
        <JDropdownItem shortcut="⏎" @select="lastAction = `Opened ${contextRow?.id}`">
          Open pull request
        </JDropdownItem>
        <JDropdownItem shortcut="⌘C" @select="lastAction = `Copied branch for ${contextRow?.id}`">
          Copy branch name
        </JDropdownItem>
        <JDropdownSeparator />
        <JDropdownItem tone="danger" @select="lastAction = `Closed ${contextRow?.id}`">
          Close pull request
        </JDropdownItem>
      </JContextMenu>
    </JStack>
  </DemoSection>

  <DemoSection title="Usage">
    <DemoCode lang="html" :code="code" code-only />
  </DemoSection>
</template>
