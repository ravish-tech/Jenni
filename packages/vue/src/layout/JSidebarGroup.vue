<script setup lang="ts">
import type { JSidebarGroupProps } from './types';

defineProps<JSidebarGroupProps>();
</script>

<template>
  <div class="j-sidebar__group" role="group" :aria-label="label">
    <div v-if="label || $slots.label" class="j-sidebar__label">
      <slot name="label">{{ label }}</slot>
    </div>
    <slot />
  </div>
</template>
