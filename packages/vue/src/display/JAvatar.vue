<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { JAvatarProps } from './types';

const props = withDefaults(defineProps<JAvatarProps>(), { size: 'md', shape: 'circle' });

type LoadState = 'loading' | 'loaded' | 'error';
const state = ref<LoadState>('loading');
const img = ref<HTMLImageElement | null>(null);

watch(() => props.src, () => { state.value = 'loading'; });
onMounted(() => {
  // Cached images may finish before Vue attaches listeners.
  const el = img.value;
  if (el?.complete) state.value = el.naturalWidth > 0 ? 'loaded' : 'error';
});

const initials = computed(() => {
  if (props.initials) return props.initials.slice(0, 2);
  const parts = (props.name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : '';
  return (first + last).toUpperCase();
});

const showImage = computed(() => !!props.src && state.value !== 'error');
</script>

<template>
  <span
    class="j-avatar"
    :data-size="size === 'md' ? undefined : size"
    :data-shape="shape === 'circle' ? undefined : shape"
    :data-tone="tone"
    :role="showImage ? undefined : 'img'"
    :aria-label="showImage ? undefined : (alt ?? name)"
  >
    <img
      v-if="showImage"
      ref="img"
      class="j-avatar__image"
      :src="src"
      :alt="alt ?? name ?? ''"
      :data-state="state === 'loading' ? 'loading' : undefined"
      @load="state = 'loaded'"
      @error="state = 'error'"
    />
    <span class="j-avatar__fallback" aria-hidden="true">
      <slot>
        <template v-if="initials">{{ initials }}</template>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.6-8 5.5 0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5 0-2.9-3.6-5.5-8-5.5Z" />
        </svg>
      </slot>
    </span>
    <span v-if="status" class="j-avatar__status" :data-status="status" role="img" :aria-label="status" />
  </span>
</template>
