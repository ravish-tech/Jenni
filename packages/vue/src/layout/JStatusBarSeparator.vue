<script setup lang="ts">
export interface JStatusBarSeparatorProps {}

defineProps<JStatusBarSeparatorProps>();
</script>

<template>
  <span
    class="j-statusbar__sep"
    role="separator"
    aria-orientation="vertical"
    aria-hidden="true"
  />
</template>
