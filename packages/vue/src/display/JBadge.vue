<script setup lang="ts">
import type { JBadgeProps } from './types';

withDefaults(defineProps<JBadgeProps>(), { variant: 'soft', size: 'md' });
</script>

<template>
  <span
    class="j-badge"
    :data-variant="variant"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
  >
    <span v-if="dot" class="j-badge__dot" aria-hidden="true" />
    <slot name="icon" />
    <slot />
  </span>
</template>
