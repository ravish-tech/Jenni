<script setup lang="ts">
import { computed } from 'vue';
import type { JSpinnerProps } from './types';

const PRESET_SIZES = new Set(['xs', 'sm', 'md', 'lg', 'xl']);

const props = withDefaults(defineProps<JSpinnerProps>(), {
  size: 'md',
  variant: 'ring',
  label: 'Loading',
});

const presetSize = computed(() => {
  if (typeof props.size === 'string' && PRESET_SIZES.has(props.size)) {
    return props.size === 'md' ? undefined : props.size;
  }
  return undefined;
});

const customStyle = computed(() => {
  const vars: Record<string, string> = {};
  if (props.size !== undefined && !(typeof props.size === 'string' && PRESET_SIZES.has(props.size))) {
    if (typeof props.size === 'number') {
      vars['--j-spinner-size'] = `${props.size}px`;
    } else {
      const trimmed = props.size.trim();
      vars['--j-spinner-size'] = /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
    }
  }
  if (props.thickness !== undefined) {
    vars['--j-spinner-stroke'] = String(props.thickness);
  }
  return Object.keys(vars).length ? vars : undefined;
});
</script>

<template>
  <span
    class="j-spinner"
    role="status"
    :aria-label="label"
    :data-size="presetSize"
    :data-variant="variant === 'ring' ? undefined : variant"
    :data-tone="tone"
    :style="customStyle"
  >
    <svg
      class="j-spinner__svg"
      viewBox="0 0 24 24"
      fill="none"
      shape-rendering="geometricPrecision"
      aria-hidden="true"
    >
      <template v-if="variant === 'dots'">
        <circle class="j-spinner__dot" cx="5" cy="12" r="2.1" fill="currentColor" />
        <circle class="j-spinner__dot" cx="12" cy="12" r="2.1" fill="currentColor" />
        <circle class="j-spinner__dot" cx="19" cy="12" r="2.1" fill="currentColor" />
      </template>
      <template v-else-if="variant === 'arc'">
        <circle
          class="j-spinner__arc"
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          stroke-linecap="round"
        />
      </template>
      <template v-else>
        <circle class="j-spinner__track" cx="12" cy="12" r="9.5" stroke="currentColor" />
        <circle
          class="j-spinner__arc"
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          stroke-linecap="round"
        />
      </template>
    </svg>
  </span>
</template>
