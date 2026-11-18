<script setup lang="ts">
import type { JProgressProps } from './types';

withDefaults(defineProps<JProgressProps>(), { value: null, max: 100, size: 'md' });
</script>

<template>
  <progress
    class="j-progress"
    :value="value ?? undefined"
    :max="max"
    :aria-label="label"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
  />
</template>
