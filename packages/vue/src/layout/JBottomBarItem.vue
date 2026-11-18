<script setup lang="ts">
import { computed } from 'vue';
import type { JBottomBarItemProps } from './types';

const props = withDefaults(defineProps<JBottomBarItemProps>(), {
  as: 'button',
});

const isButton = computed(() => props.as === 'button');
</script>

<template>
  <component
    :is="as"
    class="j-bottombar__item"
    :type="isButton ? 'button' : undefined"
    :disabled="isButton && disabled ? true : undefined"
    :aria-disabled="!isButton && disabled ? 'true' : undefined"
    :aria-current="active ? 'page' : undefined"
  >
    <span v-if="$slots.icon" class="j-bottombar__icon">
      <slot name="icon" />
      <span v-if="badge != null" class="j-bottombar__badge">{{ badge }}</span>
    </span>
    <span class="j-bottombar__label">
      <slot>{{ label }}</slot>
    </span>
  </component>
</template>
