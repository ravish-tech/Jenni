<script lang="ts">
export const meta = {
  name: 'Table / Data Table',
  group: 'Display',
  order: 14,
  description: 'High-density semantic tables and interactive data grids with sticky headers, sorting, indeterminate selection, and tabular numerals.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JTable,
  JDataTable,
  JBadge,
  JButton,
  JStack,
  JInline,
  type JDataTableColumn,
  type JDisplayTone,
  type JTableSortDirection,
} from 'jenni-vue';

interface DeploymentRow {
  id: string;
  service: string;
  environment: string;
  commit: string;
  status: 'Ready' | 'Building' | 'Degraded';
  p95Ms: number;
  monthlyCost: number;
  updated: string;
}

const columns: JDataTableColumn<DeploymentRow>[] = [
  { key: 'service', label: 'Service', sortable: true, pin: 'start' },
  { key: 'environment', label: 'Environment', sortable: true },
  { key: 'commit', label: 'Revision' },
  { key: 'status', label: 'Status', sortable: true },
  {
    key: 'p95Ms',
    label: 'p95 Latency',
    sortable: true,
    numeric: true,
    format: (v) => `${v} ms`,
  },
  {
    key: 'monthlyCost',
    label: 'Monthly Spend',
    sortable: true,
    numeric: true,
    format: (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
  },
  { key: 'updated', label: 'Updated', align: 'end' },
];

const rows: DeploymentRow[] = [
  { id: 'dep-01', service: 'edge-gateway', environment: 'Production · iad1', commit: 'a8f31c9', status: 'Ready', p95Ms: 18, monthlyCost: 1420.5, updated: '2m ago' },
  { id: 'dep-02', service: 'billing-ledger', environment: 'Production · fra1', commit: '49d02e1', status: 'Ready', p95Ms: 42, monthlyCost: 2890.0, updated: '14m ago' },
  { id: 'dep-03', service: 'vector-indexer', environment: 'Staging · sfo1', commit: 'c17b84a', status: 'Building', p95Ms: 114, monthlyCost: 640.25, updated: 'Just now' },
  { id: 'dep-04', service: 'auth-session-kv', environment: 'Production · nrt1', commit: '7e219f0', status: 'Ready', p95Ms: 9, monthlyCost: 980.0, updated: '1h ago' },
  { id: 'dep-05', service: 'webhook-relay', environment: 'Production · iad1', commit: 'f03a62d', status: 'Degraded', p95Ms: 286, monthlyCost: 410.75, updated: '5m ago' },
  { id: 'dep-06', service: 'media-transcoder', environment: 'Preview · cdg1', commit: '92bc11e', status: 'Ready', p95Ms: 67, monthlyCost: 1150.4, updated: '3h ago' },
  { id: 'dep-07', service: 'audit-archiver', environment: 'Production · fra1', commit: '3d84e5b', status: 'Ready', p95Ms: 31, monthlyCost: 530.0, updated: '6h ago' },
  { id: 'dep-08', service: 'realtime-presence', environment: 'Production · sfo1', commit: 'e41c90f', status: 'Ready', p95Ms: 14, monthlyCost: 1765.8, updated: '8h ago' },
];

const selected = ref<(string | number)[]>(['dep-01', 'dep-04']);
const sortBy = ref<string | undefined>('monthlyCost');
const sortDir = ref<JTableSortDirection>('desc');

function statusTone(status: DeploymentRow['status']): JDisplayTone {
  if (status === 'Ready') return 'success';
  if (status === 'Building') return 'info';
  return 'danger';
}

const ledgerRows = [
  { ticker: 'US10Y', venue: 'CME · Globex', bid: '4.218%', ask: '4.220%', spread: '0.2 bps', volume: '1,482,900' },
  { ticker: 'DE10Y', venue: 'Eurex · FGBL', bid: '2.341%', ask: '2.344%', spread: '0.3 bps', volume: '914,250' },
  { ticker: 'UK10Y', venue: 'ICE · Long Gilt', bid: '4.085%', ask: '4.089%', spread: '0.4 bps', volume: '412,600' },
  { ticker: 'JP10Y', venue: 'OSE · JGB', bid: '1.042%', ask: '1.045%', spread: '0.3 bps', volume: '628,100' },
  { ticker: 'CH10Y', venue: 'SIX · Conf', bid: '0.618%', ask: '0.623%', spread: '0.5 bps', volume: '184,040' },
  { ticker: 'AU10Y', venue: 'ASX · XT', bid: '4.392%', ask: '4.396%', spread: '0.4 bps', volume: '309,720' },
];

const html = `<div class="j-table-wrap" data-hover>
  <table class="j-table">
    <thead>
      <tr>
        <th scope="col" aria-sort="ascending">
          <button type="button" class="j-table__sort">
            Service <span class="j-table__sort-icon" aria-hidden="true"></span>
          </button>
        </th>
        <th scope="col">Region</th>
        <th scope="col" data-align="end">p95 Latency</th>
        <th scope="col" data-align="end">Monthly Spend</th>
      </tr>
    </thead>
    <tbody>
      <tr data-selected>
        <td>edge-gateway</td>
        <td>iad1 · Virginia</td>
        <td data-align="end">18 ms</td>
        <td data-align="end">$1,420.50</td>
      </tr>
      <tr>
        <td>billing-ledger</td>
        <td>fra1 · Frankfurt</td>
        <td data-align="end">42 ms</td>
        <td data-align="end">$2,890.00</td>
      </tr>
    </tbody>
  </table>
</div>`;
</script>

<template>
  <DemoSection
    title="Interactive Data Table"
    description="Sortable columns, header indeterminate select-all, live filter bar, custom cell slots, and pagination."
  >
    <div style="width:100%">
      <JDataTable
        v-model:selected="selected"
        v-model:sort-by="sortBy"
        v-model:sort-dir="sortDir"
        :columns="columns"
        :rows="rows"
        selectable
        searchable
        search-placeholder="Filter services, regions, or commits…"
        :page-size="5"
        pin-first
      >
        <template #actions>
          <JButton
            v-if="selected.length > 0"
            variant="outline"
            size="sm"
            @click="selected = []"
          >
            Clear selection
          </JButton>
        </template>

        <template #cell-service="{ value }">
          <span style="font-weight:var(--j-weight-medium);color:var(--j-fg)">{{ value }}</span>
        </template>

        <template #cell-commit="{ value }">
          <code style="font-family:var(--j-font-mono);font-size:var(--j-text-xs);color:var(--j-fg-muted)">{{ value }}</code>
        </template>

        <template #cell-status="{ row }">
          <JBadge size="sm" variant="soft" :tone="statusTone(row.status)" dot>
            {{ row.status }}
          </JBadge>
        </template>
      </JDataTable>
    </div>
  </DemoSection>

  <DemoSection
    title="High-density compact telemetry & sticky header"
    description="Engineered for 24px row floors and razor-sharp 1px keylines at --j-density: 0.65."
  >
    <JStack gap="item" style="width:100%" data-density="compact">
      <JInline justify="between" align="center">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">
          Scoped <code>data-density="compact"</code> · Sticky header · Striped rows
        </span>
        <JBadge size="sm" variant="outline" tone="neutral">Live Sovereign Yield Book</JBadge>
      </JInline>

      <JTable variant="striped" size="sm" hover sticky-header :max-height="196" pin-first>
        <thead>
          <tr>
            <th scope="col">Instrument</th>
            <th scope="col">Venue</th>
            <th scope="col" data-align="end">Bid</th>
            <th scope="col" data-align="end">Ask</th>
            <th scope="col" data-align="end">Spread</th>
            <th scope="col" data-align="end">24h Contracts</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in ledgerRows" :key="item.ticker">
            <th scope="row" style="font-family:var(--j-font-mono)">{{ item.ticker }}</th>
            <td style="color:var(--j-fg-muted)">{{ item.venue }}</td>
            <td data-align="end">{{ item.bid }}</td>
            <td data-align="end">{{ item.ask }}</td>
            <td data-align="end" style="color:var(--j-fg-muted)">{{ item.spread }}</td>
            <td data-align="end">{{ item.volume }}</td>
          </tr>
        </tbody>
      </JTable>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Plain semantic table with summary footer"
    description="Zero outer card chrome for embedding directly inside cards, drawers, or invoices."
  >
    <div style="width:100%">
      <JTable variant="plain" hover caption="Invoice #INV-2048 — settled via ACH.">
        <thead>
          <tr>
            <th scope="col">Line item</th>
            <th scope="col" data-align="end">Units</th>
            <th scope="col" data-align="end">Unit rate</th>
            <th scope="col" data-align="end">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dedicated compute cluster (iad1)</td>
            <td data-align="end">720 hrs</td>
            <td data-align="end">$1.85</td>
            <td data-align="end">$1,332.00</td>
          </tr>
          <tr>
            <td>Replicated NVMe block storage</td>
            <td data-align="end">4,000 GB</td>
            <td data-align="end">$0.12</td>
            <td data-align="end">$480.00</td>
          </tr>
          <tr>
            <td>Global Anycast egress</td>
            <td data-align="end">2.4 TB</td>
            <td data-align="end">$45.00</td>
            <td data-align="end">$108.00</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colspan="3">Total due (USD)</th>
            <td data-align="end">$1,920.00</td>
          </tr>
        </tfoot>
      </JTable>
    </div>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
