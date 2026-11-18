<script setup lang="ts">
import { computed } from 'vue';
import type { JTableProps } from './types';

const props = withDefaults(defineProps<JTableProps>(), {
  variant: 'surface',
  size: 'md',
  hover: false,
  stickyHeader: false,
  pinFirst: false,
  pinLast: false,
});

const wrapStyle = computed(() => {
  if (props.maxHeight == null) return undefined;
  const val = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
  return { '--j-table-max-height': val };
});
</script>

<template>
  <div
    class="j-table-wrap"
    :data-variant="variant === 'surface' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :data-hover="hover ? '' : undefined"
    :data-sticky-header="stickyHeader ? '' : undefined"
    :style="wrapStyle"
  >
    <table
      class="j-table"
      :data-pin-first="pinFirst ? '' : undefined"
      :data-pin-last="pinLast ? '' : undefined"
    >
      <caption v-if="caption || $slots.caption">
        <slot name="caption">{{ caption }}</slot>
      </caption>
      <slot />
    </table>
  </div>
</template>
