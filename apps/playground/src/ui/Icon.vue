<script setup lang="ts">
import { computed } from 'vue';
import { parseSvgIcon, resolveIcon } from 'jenni-core/behaviors/icon.js';

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 });

const strokeWidth = computed(() =>
  props.size <= 13 ? 1.95 : props.size <= 16 ? 1.75 : props.size <= 20 ? 1.6 : 1.5,
);

const parsed = computed(() => {
  const raw = resolveIcon(props.name);
  return raw ? parseSvgIcon(raw) : null;
});
</script>

<template>
  <svg
    class="pg-icon"
    :width="props.size"
    :height="props.size"
    :viewBox="parsed?.viewBox ?? '0 0 24 24'"
    :fill="parsed?.fill ?? 'none'"
    :stroke="parsed?.stroke ?? 'currentColor'"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    shape-rendering="geometricPrecision"
    aria-hidden="true"
    v-html="parsed?.body ?? ''"
  />
</template>
