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
      <slot>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          shape-rendering="geometricPrecision"
          aria-hidden="true"
        >
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
        </svg>
      </slot>
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
