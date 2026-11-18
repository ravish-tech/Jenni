<script setup lang="ts">
import type { JTopBarProps } from './types';

withDefaults(defineProps<JTopBarProps>(), {
  as: 'header',
});
</script>

<template>
  <component
    :is="as"
    class="j-topbar"
    :data-sticky="sticky ? '' : undefined"
    :data-translucent="translucent ? '' : undefined"
  >
    <div v-if="$slots.start || $slots.default" class="j-topbar__start">
      <slot name="start"><slot /></slot>
    </div>
    <div v-if="$slots.center" class="j-topbar__center">
      <slot name="center" />
    </div>
    <div v-if="$slots.end" class="j-topbar__end">
      <slot name="end" />
    </div>
  </component>
</template>
