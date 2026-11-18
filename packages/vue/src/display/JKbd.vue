<script setup lang="ts">
import type { JKbdProps } from './types';

withDefaults(defineProps<JKbdProps>(), { size: 'md' });
</script>

<template>
  <kbd class="j-kbd" :data-size="size === 'md' ? undefined : size"><slot /></kbd>
</template>
