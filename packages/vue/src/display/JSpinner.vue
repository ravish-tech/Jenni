<script setup lang="ts">
import type { JSpinnerProps } from './types';

withDefaults(defineProps<JSpinnerProps>(), { size: 'md', label: 'Loading' });
</script>

<template>
  <span
    class="j-spinner"
    role="status"
    :aria-label="label"
    :data-size="size === 'md' ? undefined : size"
  />
</template>
