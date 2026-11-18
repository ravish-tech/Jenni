<script setup lang="ts">
import { attr, type JPageProps } from './types';

withDefaults(defineProps<JPageProps>(), {
  as: 'div',
  size: 'lg',
});
</script>

<template>
  <component :is="as" class="j-page" :data-size="attr(size, 'lg')">
    <slot />
  </component>
</template>
