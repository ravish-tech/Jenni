<script setup lang="ts">
import { attr, type JBottomBarProps } from './types';

withDefaults(defineProps<JBottomBarProps>(), {
  as: 'nav',
  variant: 'tabs',
});
</script>

<template>
  <component
    :is="as"
    class="j-bottombar"
    :data-variant="attr(variant, 'tabs')"
    :data-sticky="sticky ? '' : undefined"
    :data-translucent="translucent ? '' : undefined"
    :data-tone="tone"
  >
    <slot />
  </component>
</template>
