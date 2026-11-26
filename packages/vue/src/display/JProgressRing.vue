<script setup lang="ts">
import { computed } from 'vue';
import type { JDisplayTone } from './types';

export type JProgressRingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
export type JProgressRingTone = JDisplayTone;

export interface JProgressRingProps {
  /** Omit or pass `null` for calm indeterminate sweep. */
  value?: number | null;
  max?: number;
  size?: JProgressRingSize;
  /** Stroke width in the 40×40 viewBox coordinate space (default: 3.5). */
  thickness?: number;
  tone?: JProgressRingTone;
  /** Display rounded percentage in the center when determinate. */
  showValue?: boolean;
  /** Accessible label (`aria-label`). */
  label?: string;
}

defineOptions({ name: 'JProgressRing' });

const PRESET_SIZES = new Set(['xs', 'sm', 'md', 'lg', 'xl']);

const props = withDefaults(defineProps<JProgressRingProps>(), {
  value: undefined,
  max: 100,
  size: 'md',
  showValue: false,
});

const strokeVal = computed(() =>
  props.thickness !== undefined && Number.isFinite(props.thickness) && props.thickness > 0
    ? props.thickness
    : 3.5,
);

const radius = computed(() => Math.max(4, (40 - strokeVal.value) / 2 - 0.5));
const circumference = computed(() => Number((2 * Math.PI * radius.value).toFixed(2)));

const effectiveMax = computed(() =>
  props.max !== undefined && Number.isFinite(props.max) && props.max > 0 ? props.max : 100,
);

const isIndeterminate = computed(
  () => props.value === null || props.value === undefined || !Number.isFinite(props.value),
);

const clampedValue = computed(() =>
  isIndeterminate.value ? 0 : Math.max(0, Math.min(effectiveMax.value, props.value as number)),
);

const ratio = computed(() =>
  isIndeterminate.value ? 0 : clampedValue.value / effectiveMax.value,
);

const dashOffset = computed(() =>
  Number((circumference.value * (1 - ratio.value)).toFixed(2)),
);

const displayPercent = computed(() => `${Math.round(ratio.value * 100)}%`);

const presetSize = computed(() => {
  if (typeof props.size === 'string' && PRESET_SIZES.has(props.size)) {
    return props.size === 'md' ? undefined : props.size;
  }
  return undefined;
});

const ringStyle = computed(() => {
  const vars: Record<string, string> = {
    '--_circ': String(circumference.value),
    '--_offset': String(dashOffset.value),
  };
  if (props.size !== undefined && !(typeof props.size === 'string' && PRESET_SIZES.has(props.size))) {
    if (typeof props.size === 'number') {
      vars['--j-progress-ring-size'] = `${props.size}px`;
    } else {
      const trimmed = props.size.trim();
      vars['--j-progress-ring-size'] = /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
    }
  }
  if (props.thickness !== undefined) {
    vars['--j-progress-ring-stroke'] = String(strokeVal.value);
  }
  return vars;
});
</script>

<template>
  <div
    class="j-progress-ring"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="effectiveMax"
    :aria-valuenow="isIndeterminate ? undefined : clampedValue"
    :aria-label="label"
    :data-size="presetSize"
    :data-tone="tone"
    :data-indeterminate="isIndeterminate ? '' : undefined"
    :style="ringStyle"
  >
    <svg
      class="j-progress-ring__svg"
      viewBox="0 0 40 40"
      fill="none"
      shape-rendering="geometricPrecision"
      aria-hidden="true"
    >
      <circle class="j-progress-ring__track" cx="20" cy="20" :r="radius" />
      <circle class="j-progress-ring__fill" cx="20" cy="20" :r="radius" />
    </svg>
    <span
      v-if="$slots.default || (showValue && !isIndeterminate)"
      class="j-progress-ring__label"
    >
      <slot>{{ displayPercent }}</slot>
    </span>
  </div>
</template>
