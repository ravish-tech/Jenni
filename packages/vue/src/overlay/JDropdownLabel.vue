<script setup lang="ts">
defineProps<{
  inset?: boolean;
}>();
</script>

<template>
  <div class="j-menu__label" role="presentation" :data-inset="inset ? '' : undefined">
    <slot />
  </div>
</template>
