<script setup lang="ts">
import { computed } from 'vue';
import type { JColProps } from './types';

const props = withDefaults(defineProps<JColProps>(), {
  as: 'div',
});

const subgridAttr = computed(() => {
  if (!props.subgrid) return undefined;
  return props.subgrid === true ? 'rows' : props.subgrid;
});
</script>

<template>
  <component
    :is="as"
    class="j-col"
    :data-span="span != null ? String(span) : undefined"
    :data-sm="sm != null ? String(sm) : undefined"
    :data-md="md != null ? String(md) : undefined"
    :data-lg="lg != null ? String(lg) : undefined"
    :data-start="start != null ? String(start) : undefined"
    :data-row-span="rowSpan != null ? String(rowSpan) : undefined"
    :data-order="order != null ? String(order) : undefined"
    :data-align="align"
    :data-subgrid="subgridAttr"
  >
    <slot />
  </component>
</template>
