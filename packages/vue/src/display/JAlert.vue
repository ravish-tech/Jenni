<script setup lang="ts">
import { computed } from 'vue';
import type { JAlertProps } from './types';

const props = withDefaults(defineProps<JAlertProps>(), { variant: 'soft', icon: true });

// Urgent tones interrupt screen readers; others are polite. Override with a `role` attr.
const role = computed(() => (props.tone === 'danger' || props.tone === 'warning' ? 'alert' : 'status'));
const kind = computed(() =>
  props.tone === 'success' ? 'success'
    : props.tone === 'warning' ? 'warning'
      : props.tone === 'danger' ? 'danger'
        : 'info',
);
</script>

<template>
  <div
    class="j-alert"
    :role="role"
    :data-variant="variant === 'soft' ? undefined : variant"
    :data-tone="tone"
  >
    <span v-if="icon" class="j-alert__icon" aria-hidden="true">
      <slot name="icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          shape-rendering="geometricPrecision"
        >
          <template v-if="kind === 'success'">
            <circle cx="12" cy="12" r="9.25" />
            <path d="m8.25 12.25 2.5 2.5 5-5.5" />
          </template>
          <template v-else-if="kind === 'warning'">
            <path d="M10.44 4.2a1.8 1.8 0 0 1 3.12 0l7.2 12.47A1.8 1.8 0 0 1 19.2 19.37H4.8a1.8 1.8 0 0 1-1.56-2.7Z" />
            <path d="M12 9.25v4.25M12 16.5h.01" />
          </template>
          <template v-else-if="kind === 'danger'">
            <circle cx="12" cy="12" r="9.25" />
            <path d="M12 7.75v4.75M12 15.75h.01" />
          </template>
          <template v-else>
            <circle cx="12" cy="12" r="9.25" />
            <path d="M12 11v5M12 8h.01" />
          </template>
        </svg>
      </slot>
    </span>
    <div class="j-alert__content">
      <p v-if="title || $slots.title" class="j-alert__title"><slot name="title">{{ title }}</slot></p>
      <div v-if="description || $slots.default" class="j-alert__description"><slot>{{ description }}</slot></div>
    </div>
    <div v-if="$slots.actions" class="j-alert__actions"><slot name="actions" /></div>
  </div>
</template>
