<script lang="ts">
export const meta = {
  name: 'Scroll Area',
  group: 'Layout',
  order: 7,
  description: 'Refined cross-browser scroll container with thin 6px scrollbars, overscroll containment, and 20px dynamic edge fade masks.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JScrollArea,
  JStack,
  JInline,
  JGrid,
  JList,
  JListItem,
  JBadge,
  JAvatar,
  JButton,
  JKbd,
} from 'jenni-vue';

const verticalRef = ref<InstanceType<typeof JScrollArea> | null>(null);
const vState = ref({
  canScrollStart: false,
  canScrollEnd: true,
  canScrollInlineStart: false,
  canScrollInlineEnd: false,
});

const hState = ref({
  canScrollStart: false,
  canScrollEnd: false,
  canScrollInlineStart: false,
  canScrollInlineEnd: true,
});

const releases = [
  { version: 'v2.8.0', title: 'Dynamic CSS mask-image scroll fades', author: 'Ada Lovelace', tag: 'Layout', tone: 'accent' as const, time: '2h ago' },
  { version: 'v2.7.4', title: 'Sub-pixel hairline alignment on Retina displays', author: 'Grace Hopper', tag: 'Core', tone: 'info' as const, time: '6h ago' },
  { version: 'v2.7.3', title: 'Zero-overshoot cubic-bezier(0.16, 1, 0.3, 1) curves', author: 'Dieter Rams', tag: 'Motion', tone: 'success' as const, time: '1d ago' },
  { version: 'v2.7.2', title: 'Keyline inset dividers for canonical 60px rows', author: 'Margaret Hamilton', tag: 'Layout', tone: 'neutral' as const, time: '2d ago' },
  { version: 'v2.7.1', title: 'OKLCH light-dark() status surface harmonization', author: 'Alan Turing', tag: 'Tokens', tone: 'accent' as const, time: '3d ago' },
  { version: 'v2.7.0', title: 'AppShell split & three-pane responsive drill-down', author: 'Barbara Liskov', tag: 'Shells', tone: 'info' as const, time: '5d ago' },
  { version: 'v2.6.9', title: 'Passive ResizeObserver child tracking for scrollports', author: 'Ken Thompson', tag: 'Behavior', tone: 'success' as const, time: '1w ago' },
  { version: 'v2.6.8', title: 'Reduced-motion instant token collapse across layers', author: 'Radia Perlman', tag: 'A11y', tone: 'warning' as const, time: '1w ago' },
];

const galleryStages = [
  { id: '01', name: 'Design Tokens', metric: '48 CSS vars', status: 'Locked', tone: 'success' as const, desc: 'OKLCH surfaces, 4px density grid, poised curves.' },
  { id: '02', name: 'Spatial Primitives', metric: '6 gap tiers', status: 'Stable', tone: 'accent' as const, desc: 'Stack, Inline, Grid, Container, canonical List.' },
  { id: '03', name: 'Application Shells', metric: '9 topologies', status: 'Draft', tone: 'info' as const, desc: 'Sidebar, studio, three-pane, adaptive & inset.' },
  { id: '04', name: 'Form Controls', metric: '34px md', status: 'Draft', tone: 'neutral' as const, desc: 'Crisp 1px borders, 3.5px optical focus halo.' },
  { id: '05', name: 'Floating Overlays', metric: 'Top-layer', status: 'Draft', tone: 'warning' as const, desc: 'Native dialog & popover with CSS anchor placement.' },
  { id: '06', name: 'Scroll & Masking', metric: '60fps passive', status: 'New', tone: 'accent' as const, desc: 'Thin 6px thumbs & 20px edge-aware mask gradients.' },
];

const shardRegions = ['iad-01', 'sfo-02', 'fra-01', 'lhr-03', 'nrt-01', 'sin-02', 'gru-01', 'syd-01'];
const matrixServices = [
  { service: 'edge-router', p50: ['1.2ms', '1.4ms', '1.8ms', '1.5ms', '2.1ms', '2.4ms', '3.1ms', '2.6ms'], status: '99.99%' },
  { service: 'auth-session', p50: ['3.4ms', '3.8ms', '4.1ms', '3.9ms', '4.6ms', '4.9ms', '6.2ms', '5.4ms'], status: '99.99%' },
  { service: 'token-signer', p50: ['2.1ms', '2.3ms', '2.5ms', '2.4ms', '2.9ms', '3.2ms', '4.0ms', '3.5ms'], status: '100.0%' },
  { service: 'policy-eval', p50: ['4.8ms', '5.1ms', '5.4ms', '5.0ms', '6.2ms', '6.7ms', '8.4ms', '7.1ms'], status: '99.98%' },
  { service: 'billing-ledger', p50: ['8.2ms', '8.9ms', '9.4ms', '9.1ms', '11.2ms', '11.8ms', '14.5ms', '12.9ms'], status: '99.99%' },
  { service: 'audit-writer', p50: ['5.6ms', '6.0ms', '6.3ms', '5.9ms', '7.4ms', '7.8ms', '9.6ms', '8.3ms'], status: '100.0%' },
  { service: 'search-index', p50: ['12.4ms', '13.1ms', '14.0ms', '13.6ms', '16.8ms', '17.5ms', '21.2ms', '18.9ms'], status: '99.95%' },
  { service: 'webhook-relay', p50: ['6.9ms', '7.2ms', '7.8ms', '7.4ms', '9.1ms', '9.5ms', '11.9ms', '10.4ms'], status: '99.97%' },
];

const shortShortcuts = [
  { label: 'Command palette', keys: '⌘K' },
  { label: 'Quick file open', keys: '⌘P' },
  { label: 'Toggle sidebar', keys: '⌘B' },
  { label: 'Focus search', keys: '/' },
  { label: 'Switch workspace', keys: '⌃W' },
  { label: 'Inspect tokens', keys: '⌥T' },
  { label: 'Toggle dark theme', keys: '⌘J' },
  { label: 'View keyboard map', keys: '?' },
];

function scrollVerticalTo(top: number) {
  verticalRef.value?.scrollTo({ top, behavior: 'smooth' });
}

const html = `<div
  class="j-scroll-area"
  data-fade
  data-bordered
  style="--j-scroll-max-h: 196px"
  tabindex="0"
  aria-label="Recent deployments"
>
  <div class="j-list" data-lines="2" data-inset-divider>
    <div class="j-list-item">
      <span class="j-list-item__body">
        <span class="j-list-item__title">prod-us-east-1 · #4821</span>
        <span class="j-list-item__description">Promoted in 180ms · zero dropped connections</span>
      </span>
      <span class="j-list-item__trailing"><span class="j-badge" data-size="sm" data-tone="success">Live</span></span>
    </div>
    <div class="j-list-item">
      <span class="j-list-item__body">
        <span class="j-list-item__title">prod-eu-central-1 · #4820</span>
        <span class="j-list-item__description">Schema check verified across 6 read replicas</span>
      </span>
      <span class="j-list-item__trailing"><span class="j-badge" data-size="sm" data-tone="success">Live</span></span>
    </div>
    <div class="j-list-item">
      <span class="j-list-item__body">
        <span class="j-list-item__title">staging-ap-northeast · #4819</span>
        <span class="j-list-item__description">Canary traffic shifted from 10% to 100%</span>
      </span>
      <span class="j-list-item__trailing"><span class="j-badge" data-size="sm" data-tone="info">Ready</span></span>
    </div>
    <div class="j-list-item">
      <span class="j-list-item__body">
        <span class="j-list-item__title">preview-branch-scroll · #4818</span>
        <span class="j-list-item__description">Edge fade CSS mask-image verified on WebKit &amp; Gecko</span>
      </span>
      <span class="j-list-item__trailing"><span class="j-badge" data-size="sm">Archive</span></span>
    </div>
    <div class="j-list-item">
      <span class="j-list-item__body">
        <span class="j-list-item__title">preview-tokens-oklch · #4817</span>
        <span class="j-list-item__description">Neutral chroma calibrated to 0.005 across surfaces</span>
      </span>
      <span class="j-list-item__trailing"><span class="j-badge" data-size="sm">Archive</span></span>
    </div>
  </div>
</div>`;
</script>

<template>
  <DemoSection
    title="Vertical Scroll with Dynamic Edge Fade Masks"
    description="When fade is enabled, createScrollArea observes passive scroll + ResizeObserver to apply a 20px CSS mask-image gradient exclusively at edges where additional content remains."
  >
    <JStack gap="item" style="width: 100%; max-width: 620px">
      <JInline justify="between" align="center">
        <JInline gap="inline">
          <JBadge size="sm" :variant="vState.canScrollStart ? 'soft' : 'outline'" :tone="vState.canScrollStart ? 'accent' : 'neutral'">
            top mask: {{ vState.canScrollStart ? 'on' : 'off' }}
          </JBadge>
          <JBadge size="sm" :variant="vState.canScrollEnd ? 'soft' : 'outline'" :tone="vState.canScrollEnd ? 'accent' : 'neutral'">
            bottom mask: {{ vState.canScrollEnd ? 'on' : 'off' }}
          </JBadge>
        </JInline>
        <JInline gap="related">
          <JButton size="sm" variant="outline" tone="neutral" :disabled="!vState.canScrollStart" @click="scrollVerticalTo(0)">
            Top
          </JButton>
          <JButton size="sm" variant="outline" tone="neutral" :disabled="!vState.canScrollEnd" @click="scrollVerticalTo(9999)">
            Bottom
          </JButton>
        </JInline>
      </JInline>

      <JScrollArea
        ref="verticalRef"
        fade
        bordered
        :max-height="264"
        tabindex="0"
        aria-label="Release history"
        @scroll-state-change="(s) => (vState = s)"
      >
        <JList :lines="2" inset-divider>
          <JListItem
            v-for="item in releases"
            :key="item.version"
            :title="`${item.version} — ${item.title}`"
            :description="`${item.author} · ${item.time}`"
          >
            <template #leading>
              <JAvatar :name="item.author" size="sm" />
            </template>
            <template #trailing>
              <JBadge size="sm" variant="soft" :tone="item.tone">{{ item.tag }}</JBadge>
            </template>
          </JListItem>
        </JList>
      </JScrollArea>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Horizontal Gallery Strip"
    description="orientation=&quot;horizontal&quot; constrains overflow to the inline axis and pairs left/right 20px fade masks with overscroll-behavior: contain."
  >
    <JStack gap="item" style="width: 100%">
      <JInline gap="inline">
        <JBadge size="sm" :variant="hState.canScrollInlineStart ? 'soft' : 'outline'" :tone="hState.canScrollInlineStart ? 'accent' : 'neutral'">
          start mask: {{ hState.canScrollInlineStart ? 'on' : 'off' }}
        </JBadge>
        <JBadge size="sm" :variant="hState.canScrollInlineEnd ? 'soft' : 'outline'" :tone="hState.canScrollInlineEnd ? 'accent' : 'neutral'">
          end mask: {{ hState.canScrollInlineEnd ? 'on' : 'off' }}
        </JBadge>
      </JInline>

      <JScrollArea
        orientation="horizontal"
        fade
        tabindex="0"
        aria-label="Architecture layers"
        @scroll-state-change="(s) => (hState = s)"
      >
        <JInline nowrap gap="item" style="padding-block: var(--j-space-1) var(--j-space-2)">
          <div
            v-for="stage in galleryStages"
            :key="stage.id"
            style="
              flex: 0 0 236px;
              padding: var(--j-space-4);
              border-radius: var(--j-radius-lg);
              background: var(--j-surface-1);
              box-shadow: 0 0 0 1px var(--j-border), var(--j-shadow-xs);
            "
          >
            <JStack gap="related">
              <JInline justify="between" align="center">
                <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
                  {{ stage.id }}
                </span>
                <JBadge size="sm" variant="soft" :tone="stage.tone">{{ stage.status }}</JBadge>
              </JInline>
              <div style="font-size: var(--j-text-md); font-weight: var(--j-weight-semibold); color: var(--j-fg)">
                {{ stage.name }}
              </div>
              <div style="font-size: var(--j-text-xs); line-height: var(--j-leading); color: var(--j-fg-muted)">
                {{ stage.desc }}
              </div>
              <div style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
                {{ stage.metric }}
              </div>
            </JStack>
          </div>
        </JInline>
      </JScrollArea>
    </JStack>
  </DemoSection>

  <DemoSection
    title="2D Telemetry & Log Matrix (orientation=&quot;both&quot;)"
    description="Intersects vertical and horizontal mask-image gradients cleanly when scrolling wide tables, traces, or code blocks across both axes."
  >
    <JScrollArea
      orientation="both"
      fade
      bordered
      :max-height="236"
      style="max-width: 680px"
      tabindex="0"
      aria-label="Regional p50 latency matrix"
    >
      <table
        style="
          width: max-content;
          min-width: 100%;
          border-collapse: collapse;
          font-family: var(--j-font-mono);
          font-size: var(--j-text-xs);
          font-variant-numeric: tabular-nums;
        "
      >
        <thead>
          <tr style="border-bottom: 1px solid var(--j-border); background: var(--j-surface-2); color: var(--j-fg-muted)">
            <th style="text-align: left; padding: var(--j-space-2) var(--j-space-3); font-weight: var(--j-weight-semibold)">
              service
            </th>
            <th style="text-align: left; padding: var(--j-space-2) var(--j-space-3); font-weight: var(--j-weight-semibold)">
              uptime
            </th>
            <th
              v-for="region in shardRegions"
              :key="region"
              style="text-align: right; padding: var(--j-space-2) var(--j-space-3); font-weight: var(--j-weight-semibold); min-width: 88px"
            >
              {{ region }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in matrixServices"
            :key="row.service"
            style="border-bottom: 1px solid var(--j-border)"
          >
            <td style="padding: var(--j-space-2) var(--j-space-3); font-weight: var(--j-weight-medium); color: var(--j-fg); white-space: nowrap">
              {{ row.service }}
            </td>
            <td style="padding: var(--j-space-2) var(--j-space-3); color: var(--j-success); white-space: nowrap">
              {{ row.status }}
            </td>
            <td
              v-for="(val, idx) in row.p50"
              :key="shardRegions[idx]"
              style="padding: var(--j-space-2) var(--j-space-3); text-align: right; color: var(--j-fg-muted); white-space: nowrap"
            >
              {{ val }}
            </td>
          </tr>
        </tbody>
      </table>
    </JScrollArea>
  </DemoSection>

  <DemoSection
    title="Scrollbar Modes: Subtle vs Hover vs Hidden"
    description="Consistent 6px thumb geometry prevents layout shift across modes — subtle stays quietly visible at 18% ink, hover reveals on pointer enter or active scroll, and hidden relies solely on edge fades."
  >
    <JGrid :min-cell-width="220" gap="group" style="width: 100%">
      <JStack gap="inline">
        <span style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-muted)">
          scrollbar="subtle" (default)
        </span>
        <JScrollArea scrollbar="subtle" fade bordered :max-height="184" tabindex="0" aria-label="Subtle scrollbar shortcuts">
          <JList lines="compact" variant="divided">
            <JListItem v-for="s in shortShortcuts" :key="s.label" :title="s.label">
              <template #trailing><JKbd size="sm">{{ s.keys }}</JKbd></template>
            </JListItem>
          </JList>
        </JScrollArea>
      </JStack>

      <JStack gap="inline">
        <span style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-muted)">
          scrollbar="hover"
        </span>
        <JScrollArea scrollbar="hover" fade bordered :max-height="184" tabindex="0" aria-label="Hover scrollbar shortcuts">
          <JList lines="compact" variant="divided">
            <JListItem v-for="s in shortShortcuts" :key="s.label" :title="s.label">
              <template #trailing><JKbd size="sm">{{ s.keys }}</JKbd></template>
            </JListItem>
          </JList>
        </JScrollArea>
      </JStack>

      <JStack gap="inline">
        <span style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-muted)">
          scrollbar="hidden" + fade
        </span>
        <JScrollArea scrollbar="hidden" fade bordered :max-height="184" tabindex="0" aria-label="Hidden scrollbar shortcuts">
          <JList lines="compact" variant="divided">
            <JListItem v-for="s in shortShortcuts" :key="s.label" :title="s.label">
              <template #trailing><JKbd size="sm">{{ s.keys }}</JKbd></template>
            </JListItem>
          </JList>
        </JScrollArea>
      </JStack>
    </JGrid>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
