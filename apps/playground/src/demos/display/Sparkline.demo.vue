<script lang="ts">
export const meta = {
  name: 'Sparkline',
  group: 'Display',
  order: 13.5,
  description: 'Inline SVG micro-chart with Fritsch–Carlson monotone cubic splines, vertical gradient areas, and dense telemetry bars.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import {
  JSparkline,
  JCard,
  JBadge,
  JTable,
  JStatusBar,
  JStatusBarItem,
  JStack,
  JInline,
  JGrid,
} from 'jenni-vue';

const throughputSeries = [38, 44, 41, 52, 49, 63, 58, 71, 68, 84, 79, 92];
const spikyBoundedSeries = [14, 14, 78, 78, 22, 22, 91, 30, 30, 64, 64, 88];
const barCadenceSeries = [18, 26, 22, 35, 31, 44, 39, 51, 46, 58, 53, 67];

const tones = [
  { tone: 'accent', label: 'Accent', current: '92.4 req/s', data: [41, 46, 44, 55, 52, 68, 74, 83, 92] },
  { tone: 'neutral', label: 'Neutral', current: '48.1%', data: [52, 49, 51, 47, 50, 46, 49, 48, 48] },
  { tone: 'success', label: 'Success', current: '99.98%', data: [94, 95, 96, 96, 98, 97, 99, 99, 100] },
  { tone: 'info', label: 'Info', current: '614 MB/s', data: [28, 34, 39, 36, 45, 51, 49, 58, 61] },
  { tone: 'warning', label: 'Warning', current: '78.2%', data: [31, 38, 44, 49, 57, 63, 71, 74, 78] },
  { tone: 'danger', label: 'Danger', current: '4.12% err', data: [0.4, 0.5, 0.4, 0.9, 1.4, 1.1, 2.8, 3.6, 4.1] },
] as const;

const chartPalette = [1, 2, 3, 4, 5, 6, 7, 8].map((idx) => ({
  token: `var(--j-chart-${idx})`,
  name: `--j-chart-${idx}`,
  data: throughputSeries.map((v, i) => Math.round(v + Math.sin(i * 0.9 + idx) * 14)),
}));

const serviceRows = [
  {
    service: 'edge-gateway',
    region: 'iad-01',
    p95: '18.4 ms',
    rps: '14,820',
    status: 'Healthy',
    tone: 'success' as const,
    latency: [22, 21, 19, 20, 18, 19, 17, 18, 18],
    volume: [112, 118, 124, 121, 133, 139, 142, 145, 148],
  },
  {
    service: 'vector-indexer',
    region: 'fra-02',
    p95: '64.1 ms',
    rps: '3,190',
    status: 'Elevated',
    tone: 'warning' as const,
    latency: [34, 36, 41, 45, 52, 49, 58, 62, 64],
    volume: [24, 26, 25, 29, 31, 28, 30, 31, 32],
  },
  {
    service: 'auth-token-kms',
    region: 'sfo-01',
    p95: '9.2 ms',
    rps: '8,940',
    status: 'Healthy',
    tone: 'success' as const,
    latency: [11, 10, 10, 9, 10, 9, 9, 9, 9],
    volume: [74, 78, 81, 79, 84, 86, 85, 88, 89],
  },
  {
    service: 'webhook-relay',
    region: 'nrt-01',
    p95: '142.0 ms',
    rps: '1,045',
    status: 'Degraded',
    tone: 'danger' as const,
    latency: [42, 45, 48, 79, 96, 112, 128, 135, 142],
    volume: [19, 18, 17, 15, 14, 12, 11, 11, 10],
  },
];

const cpuTrend = [24, 28, 26, 34, 31, 29, 35, 32];
const memTrend = [61, 62, 62, 63, 64, 64, 65, 65];
const netTrend = [12, 19, 15, 28, 24, 31, 27, 34];

const html = `<span class="j-sparkline" data-values="12,18,15,24,22,31" aria-label="Throughput trend"></span>
<span class="j-sparkline" data-variant="area" data-smooth data-tone="success" data-values="42,48,45,59,64,72,81"></span>
<span class="j-sparkline" data-variant="bar" data-tone="info" data-values="14,22,19,28,25,34,39"></span>`;
</script>

<template>
  <DemoSection
    title="Line, Smooth Area & Bars"
    description="Crisp polyline, Fritsch–Carlson monotone cubic spline (mathematically guaranteed never to overshoot flat plateaus or extrema), and compact bar cadence."
  >
    <JGrid :min-cell-width="230" gap="field" style="width:100%">
      <JCard size="sm">
        <JStack gap="item">
          <JInline justify="between" align="center">
            <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Linear polyline</span>
            <strong style="font-size:var(--j-text-sm);font-variant-numeric:tabular-nums">92.0k</strong>
          </JInline>
          <JSparkline
            :data="throughputSeries"
            :width="180"
            :height="36"
            show-end-dot
            label="Linear throughput trend"
          />
        </JStack>
      </JCard>

      <JCard size="sm">
        <JStack gap="item">
          <JInline justify="between" align="center">
            <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Monotone smooth area</span>
            <strong style="font-size:var(--j-text-sm);font-variant-numeric:tabular-nums">+142%</strong>
          </JInline>
          <JSparkline
            :data="spikyBoundedSeries"
            variant="area"
            smooth
            tone="success"
            :width="180"
            :height="36"
            show-end-dot
            label="Smooth monotone bounded trend"
          />
        </JStack>
      </JCard>

      <JCard size="sm">
        <JStack gap="item">
          <JInline justify="between" align="center">
            <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Discrete bars</span>
            <strong style="font-size:var(--j-text-sm);font-variant-numeric:tabular-nums">67 / min</strong>
          </JInline>
          <JSparkline
            :data="barCadenceSeries"
            variant="bar"
            tone="info"
            :width="180"
            :height="36"
            label="Commits per minute"
          />
        </JStack>
      </JCard>
    </JGrid>
  </DemoSection>

  <DemoSection
    title="Semantic Tones & Chart Palette"
    description="Use semantic data-tone tokens for health states or pass any --j-chart-1..8 series color via the color prop."
  >
    <JStack gap="group" style="width:100%">
      <JGrid :min-cell-width="210" gap="item" style="width:100%">
        <JCard v-for="item in tones" :key="item.tone" size="sm">
          <JInline justify="between" align="center">
            <JStack gap="inline">
              <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">{{ item.label }}</span>
              <strong style="font-size:var(--j-text-sm);font-variant-numeric:tabular-nums">{{ item.current }}</strong>
            </JStack>
            <JSparkline
              :data="item.data"
              :tone="item.tone"
              variant="area"
              smooth
              show-end-dot
              :width="96"
              :height="28"
            />
          </JInline>
        </JCard>
      </JGrid>

      <JCard size="sm" title="Categorical --j-chart-1..8 series">
        <JGrid :min-cell-width="175" gap="item" style="width:100%">
          <JInline
            v-for="series in chartPalette"
            :key="series.name"
            justify="between"
            align="center"
          >
            <code style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">{{ series.name }}</code>
            <JSparkline
              :data="series.data"
              :color="series.token"
              smooth
              :width="76"
              :height="22"
            />
          </JInline>
        </JGrid>
      </JCard>
    </JStack>
  </DemoSection>

  <DemoSection
    title="End-Dot & Min/Max Markers"
    description="Highlight current reading with show-end-dot or surface peak/trough extrema with show-min-max."
  >
    <JGrid :min-cell-width="260" gap="field" style="width:100%">
      <JCard size="sm">
        <JInline justify="between" align="center">
          <JStack gap="inline">
            <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Current endpoint marker</span>
            <span style="font-size:var(--j-text-xs);font-variant-numeric:tabular-nums;color:var(--j-fg)">Latest: <strong>92 ms</strong></span>
          </JStack>
          <JSparkline
            :data="throughputSeries"
            smooth
            show-end-dot
            :width="112"
            :height="28"
          />
        </JInline>
      </JCard>

      <JCard size="sm">
        <JInline justify="between" align="center">
          <JStack gap="inline">
            <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Min &amp; max extrema + endpoint</span>
            <span style="font-size:var(--j-text-xs);font-variant-numeric:tabular-nums;color:var(--j-fg)">Min 14 · Peak 91 · Last 88</span>
          </JStack>
          <JSparkline
            :data="spikyBoundedSeries"
            variant="area"
            smooth
            tone="warning"
            show-min-max
            show-end-dot
            :width="112"
            :height="28"
          />
        </JInline>
      </JCard>
    </JGrid>
  </DemoSection>

  <DemoSection
    title="Dense Table & StatusBar Telemetry"
    description="Zero-margin inline baseline alignment inside compact 28px table cells and application status bars."
  >
    <JStack gap="field" style="width:100%">
      <JTable size="sm" hover>
        <thead>
          <tr>
            <th>Service</th>
            <th>Region</th>
            <th style="text-align:right">p95 Latency</th>
            <th>Latency (15m)</th>
            <th style="text-align:right">Req / s</th>
            <th>Volume</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in serviceRows" :key="row.service">
            <td style="font-family:var(--j-font-mono);font-size:var(--j-text-xs)">{{ row.service }}</td>
            <td style="color:var(--j-fg-muted)">{{ row.region }}</td>
            <td style="text-align:right;font-variant-numeric:tabular-nums">{{ row.p95 }}</td>
            <td>
              <JSparkline
                :data="row.latency"
                :tone="row.tone"
                variant="area"
                smooth
                show-end-dot
                :width="84"
                :height="20"
              />
            </td>
            <td style="text-align:right;font-variant-numeric:tabular-nums">{{ row.rps }}</td>
            <td>
              <JSparkline
                :data="row.volume"
                variant="bar"
                tone="neutral"
                :width="68"
                :height="18"
              />
            </td>
            <td>
              <JBadge size="sm" variant="soft" :tone="row.tone">{{ row.status }}</JBadge>
            </td>
          </tr>
        </tbody>
      </JTable>

      <div style="border:1px solid var(--j-border);border-radius:var(--j-radius-md);overflow:hidden">
        <JStatusBar border="none" aria-label="Cluster telemetry status bar">
          <template #start>
            <JStatusBarItem dot tone="success" separator>cluster: us-east-prod</JStatusBarItem>
            <JStatusBarItem separator>
              <span>CPU 32%</span>
              <JSparkline :data="cpuTrend" smooth tone="accent" :width="48" :height="14" :stroke-width="1.25" />
            </JStatusBarItem>
            <JStatusBarItem>
              <span>MEM 65%</span>
              <JSparkline :data="memTrend" tone="neutral" :width="48" :height="14" :stroke-width="1.25" />
            </JStatusBarItem>
          </template>
          <template #end>
            <JStatusBarItem>
              <span>NET 340 Mbps</span>
              <JSparkline :data="netTrend" variant="bar" tone="success" :width="44" :height="14" />
            </JStatusBarItem>
          </template>
        </JStatusBar>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
