<script setup lang="ts">
import { computed } from 'vue';
import { attr, type JBentoProps } from './types';

const props = withDefaults(defineProps<JBentoProps>(), {
  as: 'div',
  gap: 'group',
});

const bentoStyle = computed(() => {
  if (props.rowMinHeight == null) return undefined;
  const v = typeof props.rowMinHeight === 'number' ? `${props.rowMinHeight}px` : props.rowMinHeight;
  return { '--j-bento-row-min': v };
});
</script>

<template>
  <component
    :is="as"
    class="j-bento"
    :data-gap="attr(gap, 'group')"
    :style="bentoStyle"
  >
    <slot />
  </component>
</template>
