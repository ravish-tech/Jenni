<script setup lang="ts">
import type { JEmptyStateProps } from './types';

withDefaults(defineProps<JEmptyStateProps>(), {
  variant: 'surface',
  size: 'md',
});
</script>

<template>
  <div
    class="j-empty-state"
    :data-variant="variant === 'surface' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
  >
    <div v-if="$slots.icon" class="j-empty-state__icon" aria-hidden="true">
      <slot name="icon" />
    </div>
    <h3 v-if="title || $slots.title" class="j-empty-state__title">
      <slot name="title">{{ title }}</slot>
    </h3>
    <p v-if="description || $slots.description" class="j-empty-state__description">
      <slot name="description">{{ description }}</slot>
    </p>
    <slot />
    <div v-if="$slots.actions" class="j-empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>
