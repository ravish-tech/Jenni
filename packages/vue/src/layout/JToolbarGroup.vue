<script setup lang="ts">
export interface JToolbarGroupProps {
  as?: string | object;
  ariaLabel?: string;
}

withDefaults(defineProps<JToolbarGroupProps>(), {
  as: 'div',
});
</script>

<template>
  <component
    :is="as"
    class="j-toolbar__group"
    role="group"
    :aria-label="ariaLabel"
  >
    <slot />
  </component>
</template>
