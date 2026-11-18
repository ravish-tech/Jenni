<script setup lang="ts">
defineProps<{ required?: boolean }>();
</script>

<template>
  <label class="j-label" :data-required="required || undefined"><slot /></label>
</template>
