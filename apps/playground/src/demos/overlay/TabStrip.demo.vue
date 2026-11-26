<script lang="ts">
export const meta = {
  name: 'Tab Strip',
  group: 'Overlay',
  order: 7.8,
  wide: true,
  description: 'Chrome-style desktop and workbench tab strip with Fitts-law top hit boxes, search dropdown, pointer reorder, vertical detach, loading spinners, status dots, hover preview cards, and extensible context menus.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JTabStrip,
  JBadge,
  JButton,
  JIcon,
  JInline,
  JStack,
  type TabStripItem,
} from 'jenni-vue';

let nextSeq = 9;

const initialWorkbenchTabs: TabStripItem[] = [
  {
    id: 'conn-prod',
    title: 'prod-us-east-1',
    icon: 'database',
    pinned: true,
    indicator: 'success',
    description: 'Primary PostgreSQL 17 cluster · 14 ms RTT · read-write session',
  },
  {
    id: 'conn-warehouse',
    title: 'analytics-ch',
    icon: 'server',
    pinned: true,
    indicator: 'info',
    description: 'ClickHouse OLAP replica · 48.2 TB indexed telemetry',
  },
  {
    id: 'q-latency',
    title: 'p99_latency_rollup.sql',
    icon: 'file-code',
    dirty: true,
    indicator: 'warning',
    description: 'Windowed p50 / p95 / p99 service latency rollup over 15-minute buckets (unsaved edits).',
  },
  {
    id: 'q-backfill',
    title: 'backfill_invoices.sql',
    icon: 'terminal',
    loading: true,
    description: 'Running batch MERGE into billing.invoices_v2 — 142,800 / 200,000 rows processed.',
  },
  {
    id: 'q-preview',
    title: 'schema_audit_preview.sql',
    icon: 'eye',
    preview: true,
    description: 'Transient preview tab — double-click the tab to promote to a permanent editor tab.',
  },
  {
    id: 'q-locks',
    title: 'pg_stat_activity.sql',
    icon: 'shield',
    indicator: 'danger',
    description: '2 blocked queries waiting on relation lock billing.ledger_entries.',
  },
  {
    id: 'q-indexes',
    title: 'unused_indexes.sql',
    icon: 'sliders',
    description: 'Scans pg_stat_user_indexes for B-tree indexes with zero tuple fetches over 30 days.',
  },
  {
    id: 'q-grants',
    title: 'role_permissions.sql',
    icon: 'lock',
    dirty: true,
    description: 'Row-level security policy verification for tenant_reader role.',
  },
];

const activeTabId = ref('q-latency');
const tabs = ref<TabStripItem[]>(initialWorkbenchTabs.map((t) => ({ ...t })));
const detachedIds = ref<string[]>([]);

interface TelemetryEntry {
  id: number;
  time: string;
  event: string;
  detail: string;
}

let logId = 1;
const telemetry = ref<TelemetryEntry[]>([
  {
    id: logId++,
    time: '00:00:00',
    event: 'ready',
    detail: 'Try search chevron, hover descriptions (~380ms), right-click menu, drag reorder, or drag >36px vertically to detach.',
  },
]);

function pushLog(event: string, detail: string) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  telemetry.value = [
    { id: logId++, time: `${hh}:${mm}:${ss}`, event, detail },
    ...telemetry.value.slice(0, 7),
  ];
}

const activeTab = computed(() => tabs.value.find((t) => t.id === activeTabId.value) ?? null);

const sampleSqlByTab: Record<string, string> = {
  'conn-prod': `-- Connection: prod-us-east-1 (PostgreSQL 17.2)
SELECT current_database(), inet_server_addr(), pg_postmaster_start_time();`,
  'conn-warehouse': `-- Connection: analytics-ch (ClickHouse 24.10)
SELECT table, formatReadableSize(sum(bytes)) AS size
FROM system.parts WHERE active GROUP BY table ORDER BY sum(bytes) DESC LIMIT 10;`,
  'q-latency': `SELECT
  date_trunc('minute', recorded_at) AS bucket,
  service_name,
  percentile_disc(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms,
  percentile_disc(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99_ms
FROM telemetry.http_spans
WHERE recorded_at >= now() - INTERVAL '6 hours'
GROUP BY 1, 2
ORDER BY bucket DESC, p99_ms DESC;`,
  'q-backfill': `MERGE INTO billing.invoices_v2 AS target
USING staging.invoice_delta AS src
ON target.invoice_id = src.invoice_id
WHEN MATCHED THEN UPDATE SET amount_cents = src.amount_cents, updated_at = now()
WHEN NOT MATCHED THEN INSERT (invoice_id, customer_id, amount_cents)
VALUES (src.invoice_id, src.customer_id, src.amount_cents);`,
  'q-preview': `-- Preview tab (italic title): double-click tab to keep open permanently
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'billing'
ORDER BY table_name, ordinal_position;`,
  'q-locks': `SELECT pid, usename, state, wait_event_type, query_start, left(query, 96) AS sql_head
FROM pg_stat_activity
WHERE wait_event_type = 'Lock'
ORDER BY query_start ASC;`,
};

const currentSql = computed(() => {
  const current = activeTab.value;
  if (!current) return '-- No open query tabs. Click + to create a new query tab.';
  return (
    sampleSqlByTab[current.id] ??
    `-- ${current.title}\nSELECT * FROM public.events WHERE created_at >= now() - INTERVAL '1 hour' LIMIT 100;`
  );
});

function handleNewTab(afterId?: string) {
  const n = nextSeq++;
  const newTab: TabStripItem = {
    id: `query-${n}`,
    title: `query_${n}.sql`,
    icon: 'file-code',
    dirty: true,
    description: `Ad-hoc SQL scratchpad #${n} · prod-us-east-1`,
  };
  if (afterId) {
    const idx = tabs.value.findIndex((t) => t.id === afterId);
    if (idx >= 0) {
      const copy = [...tabs.value];
      copy.splice(idx + 1, 0, newTab);
      tabs.value = copy;
    } else {
      tabs.value = [...tabs.value, newTab];
    }
    pushLog('@new', `Inserted ${newTab.title} to the right of "${afterId}"`);
  } else {
    tabs.value = [...tabs.value, newTab];
    pushLog('@new', `Appended ${newTab.title} from trailing + button`);
  }
  activeTabId.value = newTab.id;
}

function handleDoubleClick(id: string) {
  const target = tabs.value.find((t) => t.id === id);
  if (!target) return;
  if (target.preview) {
    tabs.value = tabs.value.map((t) => (t.id === id ? { ...t, preview: false } : t));
    pushLog('@dblclick', `Promoted preview tab "${target.title}" to permanent`);
  } else {
    pushLog('@dblclick', `Double-clicked "${target.title}"`);
  }
}

function handleDetach(payload: { id: string; x: number; y: number }) {
  const target = tabs.value.find((t) => t.id === payload.id);
  const label = target?.title ?? payload.id;
  detachedIds.value = [label, ...detachedIds.value.slice(0, 3)];
  pushLog('@detach', `Detached "${label}" at (${payload.x}, ${payload.y})`);
}

function togglePin(id: string) {
  const target = tabs.value.find((t) => t.id === id);
  if (!target) return;
  const nextPinned = !target.pinned;
  const updated = { ...target, pinned: nextPinned };
  const rest = tabs.value.filter((t) => t.id !== id);
  if (nextPinned) {
    const lastPinnedIdx = rest.reduce((acc, item, i) => (item.pinned ? i : acc), -1);
    rest.splice(lastPinnedIdx + 1, 0, updated);
    tabs.value = rest;
  } else {
    const firstUnpinnedIdx = rest.findIndex((t) => !t.pinned);
    if (firstUnpinnedIdx >= 0) rest.splice(firstUnpinnedIdx, 0, updated);
    else rest.push(updated);
    tabs.value = rest;
  }
  pushLog('pin', `${nextPinned ? 'Pinned' : 'Unpinned'} "${target.title}"`);
}

function toggleDirty(id: string) {
  tabs.value = tabs.value.map((t) => (t.id === id ? { ...t, dirty: !t.dirty } : t));
  pushLog('dirty', `Toggled unsaved indicator on "${id}"`);
}

function toggleLoading(id: string) {
  tabs.value = tabs.value.map((t) => (t.id === id ? { ...t, loading: !t.loading } : t));
  pushLog('loading', `Toggled query execution spinner on "${id}"`);
}

function resetWorkbench() {
  tabs.value = initialWorkbenchTabs.map((t) => ({ ...t }));
  activeTabId.value = 'q-latency';
  detachedIds.value = [];
  pushLog('reset', 'Restored initial SQL workbench tabs');
}

const titlebarShellStyle = {
  border: '1px solid var(--j-border)',
  borderRadius: 'var(--j-radius-lg)',
  overflow: 'clip',
  boxShadow: 'var(--j-shadow-sm)',
  '--j-tab-strip-active-bg': 'var(--j-code-bg)',
};

const trafficDotBase = {
  display: 'inline-block',
  width: '10px',
  height: '10px',
  borderRadius: '9999px',
};

const codeSnippet = `<JTabStrip
  v-model:active="activeId"
  v-model:tabs="tabs"
  titlebar
  search
  draggable
  detachable
  style="--j-tab-strip-active-bg: var(--j-code-bg)"
  @new="onNewTab"
  @dblclick="promotePreviewTab"
  @reorder="({ from, to }) => logReorder(from, to)"
  @detach="({ id, x, y }) => spawnDetachedWindow(id, x, y)"
>
  <template #context-menu="{ tab, close }">
    <button type="button" class="j-menu__item" role="menuitem" @click="togglePin(tab.id); close()">
      {{ tab.pinned ? 'Unpin tab' : 'Pin tab' }}
    </button>
  </template>
</JTabStrip>`;
</script>

<template>
  <DemoSection
    title="Desktop Title-Bar & SQL Query Workbench"
    description="Active Chrome tab connects directly into --j-code-bg below, while outer tab hit targets reach y = 0 of the strip (Fitts's Law). Click the start chevron to filter open tabs, hover tabs for 380ms preview cards, double-click italic preview tabs to pin open, right-click any tab, drag horizontally to reorder, or drag >36px vertically outside the strip to emit @detach."
  >
    <JStack gap="item" style="width: 100%">
      <JInline justify="between" wrap>
        <JInline gap="related" wrap>
          <JButton size="sm" variant="outline" @click="activeTab && toggleLoading(activeTab.id)">
            Toggle Active Spinner
          </JButton>
          <JButton size="sm" variant="outline" @click="activeTab && toggleDirty(activeTab.id)">
            Toggle Dirty Dot
          </JButton>
          <JButton size="sm" variant="outline" @click="handleNewTab(undefined)">
            + New Query Tab ({{ tabs.length }})
          </JButton>
        </JInline>
        <JButton size="sm" variant="ghost" @click="resetWorkbench">
          Reset Workbench
        </JButton>
      </JInline>

      <div :style="titlebarShellStyle">
        <JTabStrip
          v-model:active="activeTabId"
          v-model:tabs="tabs"
          titlebar
          search
          draggable
          detachable
          @new="handleNewTab"
          @close="(id) => pushLog('@close', `Closed tab &quot;${id}&quot;`)"
          @close-others="(id) => pushLog('@close-others', `Closed other tabs keeping &quot;${id}&quot;`)"
          @close-right="(id) => pushLog('@close-right', `Closed tabs to the right of &quot;${id}&quot;`)"
          @dblclick="handleDoubleClick"
          @reorder="({ from, to }) => pushLog('@reorder', `Moved index ${from} -> ${to}`)"
          @detach="handleDetach"
        >
          <template #start>
            <span style="display: inline-flex; align-items: center; gap: 6px; padding-inline: 6px 4px" aria-hidden="true">
              <span :style="{ ...trafficDotBase, backgroundColor: 'var(--j-danger)' }" />
              <span :style="{ ...trafficDotBase, backgroundColor: 'var(--j-warning)' }" />
              <span :style="{ ...trafficDotBase, backgroundColor: 'var(--j-success)' }" />
            </span>
          </template>

          <template #end>
            <JBadge v-if="activeTab?.loading" tone="accent" size="sm">Running</JBadge>
            <JBadge v-else-if="activeTab?.dirty" tone="warning" size="sm" dot>Unsaved</JBadge>
            <JBadge v-else tone="neutral" size="sm">PG 17</JBadge>
          </template>

          <template #context-menu="{ tab, close }">
            <button
              type="button"
              class="j-menu__item"
              role="menuitem"
              @click="togglePin(tab.id); close()"
            >
              <span>{{ tab.pinned ? 'Unpin tab' : 'Pin tab' }}</span>
            </button>
            <button
              v-if="tab.preview"
              type="button"
              class="j-menu__item"
              role="menuitem"
              @click="handleDoubleClick(tab.id); close()"
            >
              <span>Keep preview tab open</span>
            </button>
            <button
              type="button"
              class="j-menu__item"
              role="menuitem"
              @click="toggleLoading(tab.id); close()"
            >
              <span>{{ tab.loading ? 'Stop query spinner' : 'Simulate running query' }}</span>
            </button>
            <button
              type="button"
              class="j-menu__item"
              role="menuitem"
              @click="toggleDirty(tab.id); close()"
            >
              <span>{{ tab.dirty ? 'Mark saved' : 'Mark dirty (unsaved)' }}</span>
            </button>
          </template>
        </JTabStrip>

        <!-- Editor pane seamlessly sharing --j-code-bg with the active Chrome tab above -->
        <div
          style="background-color: var(--j-code-bg); color: var(--j-code-fg); padding: var(--j-space-4) var(--j-space-5); min-height: 164px; display: flex; flex-direction: column; justify-content: space-between; gap: var(--j-space-3)"
        >
          <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--j-space-3); flex-wrap: wrap">
            <JInline gap="inline">
              <JIcon :name="activeTab?.icon ?? 'file-code'" size="sm" />
              <strong style="font-size: var(--j-text-xs); font-family: var(--j-font-mono)">
                {{ activeTab?.title ?? 'No active tab' }}
              </strong>
              <JBadge v-if="activeTab?.preview" size="sm" tone="info">Preview (italic)</JBadge>
              <JBadge v-if="activeTab?.pinned" size="sm" tone="neutral">Pinned</JBadge>
            </JInline>
            <span style="font-size: 11.5px; color: var(--j-fg-muted)">
              {{ activeTab?.description ?? 'Select or create a query tab above.' }}
            </span>
          </div>

          <pre
            style="margin: 0; font-family: var(--j-font-mono); font-size: var(--j-text-xs); line-height: 1.55; white-space: pre-wrap; color: var(--j-code-fg)"
          >{{ currentSql }}</pre>
        </div>
      </div>

      <!-- Live Event Telemetry -->
      <div
        style="border: 1px solid var(--j-border); border-radius: var(--j-radius-md); background-color: var(--j-surface-1); padding: var(--j-space-3) var(--j-space-4)"
      >
        <JInline justify="between" style="margin-block-end: var(--j-space-2)">
          <strong style="font-size: var(--j-text-xs); color: var(--j-fg)">
            Event Telemetry Log
          </strong>
          <span v-if="detachedIds.length > 0" style="font-size: 11px; color: var(--j-fg-muted)">
            Recent @detach payloads: {{ detachedIds.join(', ') }}
          </span>
        </JInline>

        <div style="display: flex; flex-direction: column; gap: 4px; font-family: var(--j-font-mono); font-size: 11.5px">
          <div
            v-for="item in telemetry"
            :key="item.id"
            style="display: flex; align-items: baseline; gap: var(--j-space-2); color: var(--j-fg-muted)"
          >
            <span style="color: var(--j-fg-subtle); flex-shrink: 0">{{ item.time }}</span>
            <span style="color: var(--j-accent); font-weight: 600; min-inline-size: 96px; flex-shrink: 0">{{ item.event }}</span>
            <span style="color: var(--j-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ item.detail }}</span>
          </div>
        </div>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection title="Usage">
    <DemoCode lang="html" :code="codeSnippet" code-only />
  </DemoSection>
</template>
