<script setup lang="ts">
import { computed } from 'vue';

export type StatTrend = 'up' | 'down' | 'neutral';
export type StatVariant = 'surface' | 'outline' | 'ghost';
export type StatTrendTone = 'auto' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
export type StatSize = 'sm' | 'md' | 'lg';

export interface JStatProps {
  /** Metric title / KPI label. */
  label: string;
  /** Formatted metric reading. */
  value?: string | number;
  /** Leading unit or currency symbol (e.g. "$"). */
  prefix?: string;
  /** Trailing unit symbol (e.g. "ms", "%"). */
  suffix?: string;
  /** Comparative delta reading (e.g. "+12.4%", "-4.2 ms"). */
  delta?: string | number;
  /** Directional trend indicator arrow. */
  trend?: StatTrend;
  /** Semantic tone for the delta badge (`'auto'` maps up->success, down->danger, neutral->neutral). */
  trendTone?: StatTrendTone;
  /** Secondary context or comparison period label. */
  helpText?: string;
  /** Visual container treatment. */
  variant?: StatVariant;
  /** Density & typographic scale. */
  size?: StatSize;
}

defineOptions({ name: 'JStat' });

const props = withDefaults(defineProps<JStatProps>(), {
  trendTone: 'auto',
  variant: 'outline',
  size: 'md',
});

const resolvedDeltaTone = computed<Exclude<StatTrendTone, 'auto'>>(() => {
  if (props.trendTone && props.trendTone !== 'auto') return props.trendTone;
  if (props.trend === 'up') return 'success';
  if (props.trend === 'down') return 'danger';
  return 'neutral';
});
</script>

<template>
  <div
    class="j-stat"
    :data-variant="variant === 'outline' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
  >
    <div class="j-stat__header">
      <span class="j-stat__label">{{ label }}</span>
      <span v-if="$slots.icon" class="j-stat__icon" aria-hidden="true">
        <slot name="icon" />
      </span>
    </div>

    <div class="j-stat__body">
      <div class="j-stat__primary">
        <div v-if="value !== undefined || $slots.value" class="j-stat__value">
          <slot name="value">
            <span v-if="prefix" class="j-stat__affix">{{ prefix }}</span>
            <span>{{ value }}</span>
            <span v-if="suffix" class="j-stat__affix">{{ suffix }}</span>
          </slot>
        </div>

        <div
          v-if="delta !== undefined || trend || helpText || $slots.trend"
          class="j-stat__meta"
        >
          <span
            v-if="delta !== undefined || trend || $slots.trend"
            class="j-stat__delta"
            :data-trend="trend"
            :data-tone="resolvedDeltaTone"
          >
            <slot name="trend">
              <svg
                v-if="trend"
                class="j-stat__trend-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                shape-rendering="geometricPrecision"
                aria-hidden="true"
              >
                <path v-if="trend === 'up'" d="M7 17 17 7M9 7h8v8" />
                <path v-else-if="trend === 'down'" d="M7 7l10 10M17 9v8H9" />
                <path v-else d="M6 12h12" />
              </svg>
              <span v-if="delta !== undefined">{{ delta }}</span>
            </slot>
          </span>
          <span v-if="helpText" class="j-stat__help">{{ helpText }}</span>
        </div>
      </div>

      <div v-if="$slots.chart" class="j-stat__chart">
        <slot name="chart" />
      </div>
    </div>

    <div v-if="$slots.footer" class="j-stat__footer">
      <slot name="footer" />
    </div>
  </div>
</template>
