<script setup lang="ts">
import type { JSeparatorProps } from './types';

withDefaults(defineProps<JSeparatorProps>(), { orientation: 'horizontal', align: 'center' });
</script>

<template>
  <div
    class="j-separator"
    :role="decorative ? 'none' : 'separator'"
    :aria-orientation="!decorative && orientation === 'vertical' ? 'vertical' : undefined"
    :data-orientation="orientation === 'vertical' ? 'vertical' : undefined"
    :data-align="align === 'center' ? undefined : align"
  >
    <span v-if="label || $slots.default" class="j-separator__label"><slot>{{ label }}</slot></span>
  </div>
</template>
