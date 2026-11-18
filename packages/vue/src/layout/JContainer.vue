<script setup lang="ts">
import { attr, type JContainerProps } from './types';

withDefaults(defineProps<JContainerProps>(), {
  as: 'div',
  size: 'lg',
});
</script>

<template>
  <component
    :is="as"
    class="j-container"
    :data-size="attr(size, 'lg')"
    :data-padded="padded ? '' : undefined"
  >
    <slot />
  </component>
</template>
