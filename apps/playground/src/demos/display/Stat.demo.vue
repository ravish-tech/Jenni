<script lang="ts">
export const meta = {
  name: 'Stat & Metric',
  group: 'Display',
  order: 3.5,
  wide: true,
  description: 'Tabular KPI telemetry cards and divided metric bars with semantic trend overrides and inline sparklines.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JStat,
  JStatGroup,
  JSparkline,
  JIcon,
  JBadge,
  JSegmentedControl,
  JStack,
  JInline,
} from 'jenni-vue';

const groupVariant = ref<'divided' | 'cards'>('divided');
const statSize = ref<'sm' | 'md' | 'lg'>('md');

const variantOptions = [
  { label: 'Divided strip', value: 'divided' },
  { label: 'Card grid', value: 'cards' },
];

const sizeOptions = [
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
];

const revenueSeries = [62, 68, 66, 74, 79, 77, 85, 91, 89, 98, 104, 114];
const latencySeries = [34, 31, 29, 28, 25, 26, 22, 21, 20, 19, 19, 18];
const throughputSeries = [110, 118, 115, 126, 134, 131, 142, 149, 147, 158, 164, 172];
const errorSeries = [0.18, 0.21, 0.19, 0.34, 0.42, 0.38, 0.51, 0.62, 0.59, 0.74, 0.81, 0.86];

const html = `<div class="j-stat-group" data-variant="divided">
  <div class="j-stat">
    <div class="j-stat__header">
      <span class="j-stat__label">p95 Edge Latency</span>
    </div>
    <div class="j-stat__body">
      <div class="j-stat__primary">
        <div class="j-stat__value">18.4<span class="j-stat__affix">ms</span></div>
        <div class="j-stat__meta">
          <span class="j-stat__delta" data-trend="down" data-tone="success">-6.2 ms</span>
          <span class="j-stat__help">vs. prior 24h</span>
        </div>
      </div>
    </div>
  </div>
</div>`;
</script>

<template>
  <DemoSection
    title="Divided Telemetry Bar & KPI Grid"
    description="Switch between a unified bordered telemetry strip with 1px internal hairlines and discrete KPI cards. Resize the viewport or pane to observe @container-responsive reflow."
  >
    <JStack gap="field" style="width:100%">
      <JInline justify="between" align="center">
        <JSegmentedControl v-model="groupVariant" size="sm" :options="variantOptions" />
        <JSegmentedControl v-model="statSize" size="sm" :options="sizeOptions" />
      </JInline>

      <JStatGroup :cols="4" :variant="groupVariant">
        <JStat
          label="Net Recurring Revenue"
          prefix="$"
          value="482,910"
          delta="+14.8%"
          trend="up"
          help-text="vs. last month"
          :size="statSize"
        >
          <template #chart>
            <JSparkline
              :data="revenueSeries"
              variant="area"
              smooth
              tone="success"
              show-end-dot
              :width="84"
              :height="28"
            />
          </template>
        </JStat>

        <JStat
          label="p95 Edge Latency"
          value="18.4"
          suffix="ms"
          delta="-6.2 ms"
          trend="down"
          trend-tone="success"
          help-text="38 regions healthy"
          :size="statSize"
        >
          <template #chart>
            <JSparkline
              :data="latencySeries"
              variant="area"
              smooth
              tone="success"
              show-end-dot
              :width="84"
              :height="28"
            />
          </template>
        </JStat>

        <JStat
          label="Request Throughput"
          value="172.4"
          suffix="k/s"
          delta="+8.1%"
          trend="up"
          help-text="peak 194k/s"
          :size="statSize"
        >
          <template #chart>
            <JSparkline
              :data="throughputSeries"
              variant="bar"
              tone="accent"
              :width="76"
              :height="26"
            />
          </template>
        </JStat>

        <JStat
          label="5xx Error Budget"
          value="0.86"
          suffix="%"
          delta="+0.31%"
          trend="up"
          trend-tone="danger"
          help-text="SLO threshold 1.00%"
          :size="statSize"
        >
          <template #chart>
            <JSparkline
              :data="errorSeries"
              variant="area"
              smooth
              tone="danger"
              show-end-dot
              :width="84"
              :height="28"
            />
          </template>
        </JStat>
      </JStatGroup>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Semantic Trend Tone Overrides"
    description="By default trend='up' maps to success and trend='down' maps to danger. Override trend-tone explicitly when lower numbers indicate healthier performance (latency, queue depth, or cloud spend)."
  >
    <JStatGroup :cols="3" variant="cards">
      <JStat
        label="Cold Start Duration"
        value="41"
        suffix="ms"
        delta="-28%"
        trend="down"
        trend-tone="success"
        help-text="Isolate snapshot v4"
      >
        <template #icon>
          <JIcon name="clock" size="sm" />
        </template>
      </JStat>

      <JStat
        label="Dead-Letter Queue"
        value="1,284"
        delta="+412"
        trend="up"
        trend-tone="warning"
        help-text="Retry worker draining"
      >
        <template #icon>
          <JIcon name="alert-triangle" size="sm" />
        </template>
      </JStat>

      <JStat
        label="Schema Drift"
        value="0"
        suffix="diffs"
        delta="0.0%"
        trend="neutral"
        help-text="12 replicas synchronized"
      >
        <template #icon>
          <JIcon name="check-circle" size="sm" />
        </template>
      </JStat>
    </JStatGroup>
  </DemoSection>

  <DemoSection
    title="Surface Treatments & Footer Metadata"
    description="Outline (default), surface, and borderless ghost variants with optional footer context strips."
  >
    <JStatGroup :cols="3" variant="cards">
      <JStat
        variant="outline"
        label="Outline Card (Default)"
        prefix="$"
        value="94.20"
        delta="+3.4%"
        trend="up"
        help-text="ARPU · Enterprise"
      >
        <template #footer>
          <span>Cohort Q4-2026</span>
          <JBadge size="sm" variant="soft" tone="success">Audited</JBadge>
        </template>
      </JStat>

      <JStat
        variant="surface"
        label="Tinted Surface"
        value="99.994"
        suffix="%"
        delta="+0.002%"
        trend="up"
        help-text="Rolling 90-day uptime"
      >
        <template #footer>
          <span>Multi-region quorum</span>
          <span style="font-family:var(--j-font-mono)">us-east · eu-central</span>
        </template>
      </JStat>

      <JStat
        variant="ghost"
        label="Ghost Inline Readout"
        value="14,902"
        delta="0.0%"
        trend="neutral"
        help-text="Active WebSocket sessions"
      >
        <template #footer>
          <span>Zero border chrome for sidebars</span>
        </template>
      </JStat>
    </JStatGroup>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
