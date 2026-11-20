<script setup lang="ts">
export interface JToolbarSeparatorProps {
  orientation?: 'vertical' | 'horizontal';
}

withDefaults(defineProps<JToolbarSeparatorProps>(), {
  orientation: 'vertical',
});
</script>

<template>
  <span
    class="j-toolbar__separator"
    role="separator"
    :aria-orientation="orientation"
  />
</template>
