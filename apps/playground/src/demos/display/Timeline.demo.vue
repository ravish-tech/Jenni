<script lang="ts">
export const meta = {
  name: 'Timeline',
  group: 'Display',
  order: 16.5,
  description: 'Semantic chronological event, deployment, and audit feed with architectural rings, icon markers, active step halos, and solid or dashed rails.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JTimeline,
  JTimelineItem,
  JCard,
  JBadge,
  JSegmentedControl,
  JStack,
  JInline,
} from 'jenni-vue';

const timelineSize = ref<'sm' | 'md'>('md');
const railStyle = ref<'solid' | 'dashed'>('solid');

const sizeOptions = [
  { label: 'Medium', value: 'md' },
  { label: 'Compact (sm)', value: 'sm' },
];

const lineOptions = [
  { label: 'Solid rail', value: 'solid' },
  { label: 'Dashed rail', value: 'dashed' },
];

const auditEvents = [
  {
    id: 'evt-4',
    title: 'TLS certificate rotated on edge-iad-01',
    time: '14:48:12 UTC',
    description: 'ECDSA P-256 leaf certificate propagated across 38 PoPs in 1.9s.',
    tone: 'success' as const,
    active: true,
  },
  {
    id: 'evt-3',
    title: 'Rate-limit policy updated',
    time: '13:15:04 UTC',
    description: 'Raised burst ceiling from 1,200 to 2,500 req/min for verified webhooks.',
    tone: 'info' as const,
  },
  {
    id: 'evt-2',
    title: 'Elevated p99 queue latency detected',
    time: '11:02:49 UTC',
    description: 'Transient spike to 142 ms during shard rebalance; auto-healed within 90s.',
    tone: 'warning' as const,
  },
  {
    id: 'evt-1',
    title: 'Daily snapshot archived',
    time: '04:00:00 UTC',
    description: 'Encrypted WAL checkpoint verified (SHA-256 checksum match).',
    tone: 'neutral' as const,
  },
];

const html = `<ol class="j-timeline">
  <li class="j-timeline__item" data-tone="success" data-active aria-current="step">
    <div class="j-timeline__axis" aria-hidden="true">
      <div class="j-timeline__marker-wrap"><span class="j-timeline__marker"></span></div>
      <span class="j-timeline__rail"></span>
    </div>
    <div class="j-timeline__content">
      <div class="j-timeline__header">
        <span class="j-timeline__title">Production traffic shifted to v2.8.0</span>
        <span class="j-timeline__time">14:48:12 UTC</span>
      </div>
      <p class="j-timeline__description">100% canary weight promoted with zero error budget burn.</p>
    </div>
  </li>
</ol>`;
</script>

<template>
  <DemoSection
    title="Deployment & Release Pipeline"
    description="Declarative <JTimelineItem> composition with built-in stroke icons, rich slotted artifacts, active step halo, and per-item dashed rails for upcoming stages."
  >
    <div style="width:100%;max-width:600px">
      <JTimeline>
        <JTimelineItem
          tone="success"
          icon="git-merge"
          title="Merged pull request #1842 into main"
          time="14:21:05"
          description="Monotone spline interpolation and virtualized column pinning."
        >
          <JInline gap="related" align="center">
            <JBadge size="sm" variant="outline" tone="neutral">commit 9f3c2a1</JBadge>
            <JBadge size="sm" variant="soft" tone="success">+318 / -44</JBadge>
          </JInline>
        </JTimelineItem>

        <JTimelineItem
          tone="success"
          icon="check-circle"
          title="Verification suite passed"
          time="14:24:39"
          description="412 unit, accessibility, and container-query layout assertions succeeded."
        />

        <JTimelineItem
          tone="accent"
          icon="terminal"
          active
          line="dashed"
          title="Canary rollout at 50% weight"
          time="14:29:10"
          description="Monitoring p95 latency and 5xx error budget before global promotion."
        >
          <JCard size="sm" variant="outline" style="margin-top:var(--j-space-1)">
            <JInline justify="between" align="center">
              <span style="font-family:var(--j-font-mono);font-size:var(--j-text-xs);color:var(--j-fg)">
                us-east · eu-central · ap-northeast
              </span>
              <JBadge size="sm" dot variant="soft" tone="accent">Observing</JBadge>
            </JInline>
          </JCard>
        </JTimelineItem>

        <JTimelineItem
          tone="neutral"
          title="Promote 100% global production traffic"
          time="Scheduled · 14:45:00"
          description="Automatic promotion once 15-minute canary window completes cleanly."
        />
      </JTimeline>
    </div>
  </DemoSection>

  <DemoSection
    title="Architectural Rings & Data-Driven Shorthand"
    description="Omit icon to render poised architectural rings, and pass an items array for concise audit logs across default and compact inspector sizes."
  >
    <JStack gap="field" style="width:100%;max-width:600px">
      <JInline justify="between" align="center">
        <JSegmentedControl v-model="timelineSize" size="sm" :options="sizeOptions" />
        <JSegmentedControl v-model="railStyle" size="sm" :options="lineOptions" />
      </JInline>

      <JCard size="sm">
        <JTimeline :items="auditEvents" :size="timelineSize" :line="railStyle" />
      </JCard>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
