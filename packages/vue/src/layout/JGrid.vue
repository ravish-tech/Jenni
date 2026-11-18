<script setup lang="ts">
import { computed } from 'vue';
import { attr, type JGridProps } from './types';

const props = withDefaults(defineProps<JGridProps>(), {
  as: 'div',
  gap: 'group',
});

const gridStyle = computed(() => {
  if (props.minCellWidth == null) return undefined;
  const v = typeof props.minCellWidth === 'number' ? `${props.minCellWidth}px` : props.minCellWidth;
  return { '--j-grid-min': v };
});
</script>

<template>
  <component
    :is="as"
    class="j-grid"
    :data-cols="cols != null ? String(cols) : undefined"
    :data-gap="attr(gap, 'group')"
    :data-col-gap="colGap"
    :data-row-gap="rowGap"
    :data-flow="attr(flow, 'row')"
    :data-align="align"
    :data-justify="justify"
    :data-container="container ? '' : undefined"
    :data-guides="guides ? '' : undefined"
    :style="gridStyle"
  >
    <slot />
  </component>
</template>
