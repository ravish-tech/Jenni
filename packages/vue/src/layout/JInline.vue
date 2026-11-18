<script setup lang="ts">
import { attr, type JInlineProps } from './types';

withDefaults(defineProps<JInlineProps>(), {
  as: 'div',
  gap: 'related',
});
</script>

<template>
  <component
    :is="as"
    class="j-inline"
    :data-gap="attr(gap, 'related')"
    :data-align="attr(align, 'center')"
    :data-justify="justify"
    :data-nowrap="nowrap ? '' : undefined"
  >
    <slot />
  </component>
</template>
