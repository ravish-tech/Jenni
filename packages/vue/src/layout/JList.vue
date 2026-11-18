<script setup lang="ts">
import { computed } from 'vue';
import { attr, type JListProps } from './types';

const props = withDefaults(defineProps<JListProps>(), {
  as: 'div',
  variant: 'plain',
  lines: 1,
});

const linesAttr = computed(() => {
  const l = String(props.lines);
  return l === '1' ? undefined : l;
});
</script>

<template>
  <component
    :is="as"
    class="j-list"
    :role="as === 'div' ? 'list' : undefined"
    :data-variant="attr(variant, 'plain')"
    :data-lines="linesAttr"
    :data-inset-divider="insetDivider ? '' : undefined"
    :data-tone="tone"
  >
    <slot />
  </component>
</template>
