<script setup lang="ts">
import { computed } from 'vue';
import { getEntityHue } from 'jenni-core/behaviors/entity-color.js';
import type { JProgressProps } from './types';

const props = withDefaults(defineProps<JProgressProps>(), { value: null, size: 'md' });

const hasSegments = computed(() => Boolean(props.segments && props.segments.length > 0));
const stepCount = computed(() =>
  props.steps && props.steps > 0 ? Math.max(1, Math.floor(props.steps)) : 0,
);

const totalSegmentValue = computed(() => {
  if (!props.segments) return 0;
  let sum = 0;
  for (const s of props.segments) {
    if (Number.isFinite(s.value) && s.value > 0) sum += s.value;
  }
  return sum;
});

const effectiveSegMax = computed(() => {
  const baseMax = props.max && props.max > 0 ? props.max : 100;
  return Math.max(baseMax, totalSegmentValue.value);
});

const renderedSegments = computed(() => {
  if (!props.segments) return [];
  const maxVal = effectiveSegMax.value;
  return props.segments
    .filter((s) => Number.isFinite(s.value) && s.value > 0)
    .map((s) => {
      const pct = maxVal > 0 ? Math.min(100, (s.value / maxVal) * 100) : 0;
      const entityHue =
        !s.tone && !s.color && s.colorSeed ? getEntityHue(s.colorSeed) : undefined;
      const style: Record<string, string> = {
        width: `${pct}%`,
        flexBasis: `${pct}%`,
      };
      if (s.color) style['--_seg-bg'] = s.color;
      else if (entityHue !== undefined) style['--j-entity-hue'] = String(entityHue);
      return {
        tone: s.tone,
        label: s.label,
        hasEntityColor: entityHue !== undefined,
        style,
      };
    });
});

const segmentSummary = computed(() => {
  if (!props.segments) return undefined;
  const parts = props.segments
    .filter((s) => Boolean(s.label))
    .map((s) => `${s.label}: ${s.value}`);
  return parts.length ? parts.join(', ') : undefined;
});

const effectiveStepMax = computed(() =>
  props.max && props.max > 0 ? props.max : stepCount.value,
);

const stepValueNow = computed(() =>
  Math.max(0, Math.min(effectiveStepMax.value, props.value ?? 0)),
);

const filledSteps = computed(() => {
  if (!stepCount.value || effectiveStepMax.value <= 0) return 0;
  return Math.round((stepValueNow.value / effectiveStepMax.value) * stepCount.value);
});
</script>

<template>
  <div
    v-if="hasSegments"
    class="j-progress-segmented"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="effectiveSegMax"
    :aria-valuenow="totalSegmentValue"
    :aria-label="label"
    :aria-valuetext="segmentSummary"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
  >
    <div
      v-for="(seg, idx) in renderedSegments"
      :key="idx"
      class="j-progress-segmented__bar"
      :data-tone="seg.tone"
      :data-entity-color="seg.hasEntityColor ? '' : undefined"
      :title="seg.label || undefined"
      :style="seg.style"
    />
  </div>
  <div
    v-else-if="stepCount > 0"
    class="j-progress-segmented"
    data-steps=""
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="effectiveStepMax"
    :aria-valuenow="stepValueNow"
    :aria-label="label"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
  >
    <div
      v-for="idx in stepCount"
      :key="idx"
      class="j-progress-segmented__step"
      :data-filled="idx <= filledSteps ? '' : undefined"
    />
  </div>
  <progress
    v-else
    class="j-progress"
    :value="value ?? undefined"
    :max="max ?? 100"
    :aria-label="label"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
  />
</template>
