<script setup lang="ts">
import { computed } from 'vue';
import { attr, type JBoardProps } from './types';

const props = withDefaults(defineProps<JBoardProps>(), {
  as: 'div',
  gap: 'field',
});

const boardStyle = computed(() => {
  if (props.columnWidth == null) return undefined;
  const w = typeof props.columnWidth === 'number' ? `${props.columnWidth}px` : props.columnWidth;
  return { '--j-board-col-w': w };
});
</script>

<template>
  <component
    :is="as"
    class="j-board"
    :data-gap="attr(gap, 'field')"
    :style="boardStyle"
  >
    <slot />
  </component>
</template>
