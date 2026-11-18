<script setup lang="ts">
import { attr, type JStackProps } from './types';

withDefaults(defineProps<JStackProps>(), {
  as: 'div',
  gap: 'field',
});
</script>

<template>
  <component
    :is="as"
    class="j-stack"
    :data-gap="attr(gap, 'field')"
    :data-align="align"
    :data-justify="justify"
  >
    <slot />
  </component>
</template>
