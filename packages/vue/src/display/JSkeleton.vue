<script setup lang="ts">
import { computed } from 'vue';
import type { JSkeletonProps } from './types';

const props = withDefaults(defineProps<JSkeletonProps>(), { shape: 'rect' });

const toLength = (v?: string | number) => (typeof v === 'number' ? `${v}px` : v);
const style = computed(() => {
  const w = toLength(props.width);
  const h = toLength(props.height);
  if (props.shape === 'circle' && (w || h)) return { '--j-skeleton-size': w ?? h };
  return { inlineSize: w, blockSize: h };
});
</script>

<template>
  <div v-if="lines && lines > 1" class="j-skeleton-lines" aria-hidden="true" :style="{ inlineSize: toLength(width) }">
    <div v-for="n in lines" :key="n" class="j-skeleton" data-shape="text" />
  </div>
  <div
    v-else
    class="j-skeleton"
    aria-hidden="true"
    :data-shape="shape === 'rect' ? undefined : shape"
    :style="style"
  >
    <slot />
  </div>
</template>
