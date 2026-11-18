<script setup lang="ts">
import type { JBreadcrumbItemProps } from './types';

withDefaults(defineProps<JBreadcrumbItemProps>(), {
  current: false,
  ellipsis: false,
  label: 'More breadcrumbs',
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
  <li class="j-breadcrumb__item">
    <button
      v-if="ellipsis"
      type="button"
      class="j-breadcrumb__ellipsis"
      :aria-label="label"
      @click="emit('click', $event)"
    >
      <slot>…</slot>
    </button>
    <span v-else-if="current || !href" class="j-breadcrumb__page" :aria-current="current ? 'page' : undefined">
      <slot name="icon" />
      <slot />
    </span>
    <a v-else class="j-breadcrumb__link" :href="href" @click="emit('click', $event)">
      <slot name="icon" />
      <slot />
    </a>
  </li>
</template>
