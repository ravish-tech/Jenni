<script setup lang="ts">
import { computed } from 'vue';
import type { JSidebarItemProps } from './types';

const props = withDefaults(defineProps<JSidebarItemProps>(), {
  as: 'button',
});

const isButton = computed(() => props.as === 'button');
</script>

<template>
  <component
    :is="as"
    class="j-sidebar__item"
    :type="isButton ? 'button' : undefined"
    :disabled="isButton && disabled ? true : undefined"
    :aria-disabled="!isButton && disabled ? 'true' : undefined"
    :aria-current="active ? 'page' : undefined"
    :title="label"
  >
    <span v-if="$slots.icon" class="j-sidebar__item-icon">
      <slot name="icon" />
    </span>
    <span class="j-sidebar__item-label">
      <slot>{{ label }}</slot>
    </span>
    <span v-if="badge != null || $slots.badge" class="j-sidebar__item-badge">
      <slot name="badge">{{ badge }}</slot>
    </span>
  </component>
</template>
