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
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="kind === 'success'">
            <circle cx="8" cy="8" r="6.25" />
            <path d="m5.5 8.25 1.75 1.75 3.25-3.75" />
          </template>
          <template v-else-if="kind === 'warning'">
            <path d="M7.13 2.5a1 1 0 0 1 1.74 0l5.4 9.5a1 1 0 0 1-.87 1.5H2.6a1 1 0 0 1-.87-1.5z" />
            <path d="M8 6.5v2.75M8 11.25v.01" />
          </template>
          <template v-else-if="kind === 'danger'">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 4.75v3.75M8 10.75v.01" />
          </template>
          <template v-else>
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 7.25v3.5M8 5.25v.01" />
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
