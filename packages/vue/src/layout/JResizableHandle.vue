<script setup lang="ts">
import type { JResizableHandleProps } from './types';

withDefaults(defineProps<JResizableHandleProps>(), {
  withGrip: false,
  disabled: false,
});
</script>

<template>
  <div
    class="j-resizable__handle"
    role="separator"
    :tabindex="disabled ? -1 : 0"
    :aria-disabled="disabled ? 'true' : undefined"
    :aria-label="ariaLabel || undefined"
    :data-with-grip="withGrip ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
  />
</template>
