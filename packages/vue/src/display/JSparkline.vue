<script setup lang="ts">
import { computed, useId } from 'vue';
import {
  computeSparkline,
  type SparklinePoint,
  type SparklineVariant,
} from 'jenni-core/behaviors/sparkline.js';
import type { JDisplayTone } from './types';

export type JSparklineVariant = SparklineVariant;
export type JSparklineTone = JDisplayTone;

export interface JSparklineProps {
  data: readonly number[];
  variant?: JSparklineVariant;
  width?: number | string;
  height?: number | string;
  tone?: JSparklineTone;
  color?: string;
  smooth?: boolean;
  strokeWidth?: number;
  min?: number;
  max?: number;
  showEndDot?: boolean;
  showMinMax?: boolean;
  fillOpacity?: number;
  label?: string;
}

defineOptions({ name: 'JSparkline' });

const props = withDefaults(defineProps<JSparklineProps>(), {
  variant: 'line',
  width: 88,
  height: 24,
  smooth: false,
  strokeWidth: 1.5,
  showEndDot: false,
  showMinMax: false,
  fillOpacity: 0.16,
});

const rawId = useId();
const gradientId = `j-spark-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
const areaFillUrl = `url(#${gradientId})`;

function resolveDimension(val: number | string | undefined, fallback: number): number {
  if (typeof val === 'number' && Number.isFinite(val) && val > 0) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.endsWith('%')) return fallback;
    const parsed = Number.parseFloat(trimmed);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

const numericWidth = computed(() => resolveDimension(props.width, 88));
const numericHeight = computed(() => resolveDimension(props.height, 24));

const padding = computed(() =>
  props.showEndDot || props.showMinMax
    ? Math.max(2.5, props.strokeWidth + 1)
    : Math.max(2, props.strokeWidth),
);

const geometry = computed(() =>
  computeSparkline(props.data, {
    width: numericWidth.value,
    height: numericHeight.value,
    strokeWidth: props.strokeWidth,
    padding: padding.value,
    variant: props.variant,
    smooth: props.smooth,
    min: props.min,
    max: props.max,
  }),
);

const hasLabel = computed(() => Boolean(props.label && props.label.trim().length > 0));

const rootStyle = computed<Record<string, string> | undefined>(() => {
  if (!props.color) return undefined;
  return { '--j-sparkline-color': props.color };
});

const dotRadius = computed(() => Math.max(1.75, props.strokeWidth + 0.5));

interface MarkerDot {
  key: string;
  kind: 'end' | 'min' | 'max';
  x: number;
  y: number;
}

const dots = computed<MarkerDot[]>(() => {
  if (props.variant === 'bar') return [];
  const list: MarkerDot[] = [];
  const used = new Set<number>();

  const pushDot = (pt: SparklinePoint | null, kind: 'end' | 'min' | 'max') => {
    if (!pt || used.has(pt.index)) return;
    used.add(pt.index);
    list.push({ key: `${kind}-${pt.index}`, kind, x: pt.x, y: pt.y });
  };

  if (props.showEndDot) pushDot(geometry.value.lastPoint, 'end');
  if (props.showMinMax) {
    pushDot(geometry.value.maxPoint, 'max');
    pushDot(geometry.value.minPoint, 'min');
  }
  return list;
});
</script>

<template>
  <span
    class="j-sparkline"
    data-j-managed=""
    :data-variant="variant === 'line' ? undefined : variant"
    :data-tone="tone"
    :role="hasLabel ? 'img' : undefined"
    :aria-label="hasLabel ? label : undefined"
    :aria-hidden="hasLabel ? undefined : 'true'"
    :style="rootStyle"
  >
    <svg
      class="j-sparkline__svg"
      :width="width"
      :height="height"
      :viewBox="geometry.viewBox"
      focusable="false"
      aria-hidden="true"
    >
      <defs v-if="variant === 'area' && geometry.areaPath">
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="currentColor" :stop-opacity="fillOpacity" />
          <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
        </linearGradient>
      </defs>

      <template v-if="variant === 'bar'">
        <rect
          v-for="bar in geometry.bars"
          :key="bar.index"
          class="j-sparkline__bar"
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          :rx="bar.width >= 3 ? 1 : 0.5"
          :data-last="bar.isLast ? '' : undefined"
          :data-min="bar.isMin ? '' : undefined"
          :data-max="bar.isMax ? '' : undefined"
        />
      </template>

      <template v-else>
        <path
          v-if="variant === 'area' && geometry.areaPath"
          class="j-sparkline__area"
          :d="geometry.areaPath"
          :fill="areaFillUrl"
        />
        <path
          v-if="geometry.linePath"
          class="j-sparkline__line"
          :d="geometry.linePath"
          :stroke-width="strokeWidth"
        />
        <circle
          v-for="dot in dots"
          :key="dot.key"
          class="j-sparkline__dot"
          :cx="dot.x"
          :cy="dot.y"
          :r="dotRadius"
          :data-end="dot.kind === 'end' ? '' : undefined"
          :data-min="dot.kind === 'min' ? '' : undefined"
          :data-max="dot.kind === 'max' ? '' : undefined"
        />
      </template>
    </svg>
  </span>
</template>
