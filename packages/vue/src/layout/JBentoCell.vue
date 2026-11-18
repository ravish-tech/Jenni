<script setup lang="ts">
import { computed } from 'vue';
import { type JBentoCellProps } from './types';

const props = withDefaults(defineProps<JBentoCellProps>(), {
  as: 'div',
  span: 4,
});

const spanAttr = computed(() => {
  const s = String(props.span);
  return s === '4' ? undefined : s;
});

const rowSpanAttr = computed(() => {
  if (props.rowSpan == null) return undefined;
  const r = String(props.rowSpan);
  return r === '1' ? undefined : r;
});
</script>

<template>
  <component
    :is="as"
    class="j-bento__cell"
    :data-span="spanAttr"
    :data-row-span="rowSpanAttr"
    :data-surface="surface ? '' : undefined"
  >
    <slot />
  </component>
</template>
